const process = require("node:process");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  codeBlock,
  WebhookClient,
} = require("discord.js");
const betterSQL = require("better-sqlite3");
const { rules } = require("./files/rules-content");
const { guide } = require("./files/guide-content");
const { perks } = require("./files/level-perks");
const { JsonDB, Config } = require("node-json-db");

// Load Environment file.
process.loadEnvFile(".env");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const clientId = "1448012671726125117";
const owners = ["1143607268781342893"];

/**
 * Slowly changing the database from
 * BetterSQL to JsonDB
 * To keep a presistent database across development
 * and production processees.
 */
const db = betterSQL("db/veloria.db");
const jdb = new JsonDB(new Config("db/jdb", true, false, "/", true))

client.on("clientReady", async (client) => {
  try {
    db.pragma("journal_mode = WAL");

    // Create the users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            whitelisted INTEGER NOT NULL DEFAULT 0
        )
    `);

    // Create the bot settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bot (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         logEnabled INTEGER NOT NULL DEFAULT 0,
         logWebhook VARCHAR(2083)
      )
    `);
  } catch (error) {
    console.error(error);
  }

  console.info(`V     Ready - ${client.user.username}`);
  sendAction("CLIENT_READY", "Veloria is ready.");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  sendAction(
    "BOT_READ_MESSAGE",
    `@ ${message.author}\n\'#\ ${message.channel}`,
  );
  const prefix = "v?";
  if (!message.content.startsWith(prefix)) return;
  if (!message.guildId) return message.reply(":x: )- Disabled in DM's");

  const guild = message.guild;
  const client = message.client;
  const ap = message.content.substring(prefix.length).trim();
  if (ap.length === 0) return;
  const command = ap.split(" ")[0].toLowerCase();

  console.info(`V     Command used ${command}`);
  sendAction(
    "BOT_READ_COMMAND",
    `@ ${message.author}\n\'#\ ${message.channel}\nV? ${command}\n() ${JSON.stringify(getArguments(message.content))}`,
  );

  /**
   * Expected: One(UID) - One(TOF)
   * UID: User to whitelist
   * TOF: Whitelisted or not
   */
  if (command === "whitelist") {
    if (!owners.includes(message.author.id)) {
      return message.reply(":x: )- You can't use this command.");
    }

    const args = getArguments(message.content);

    if (!args.uid.at(0) || args.tof.at(0) === undefined)
      return message.reply(":x: )- UID(1!) || TOF(1!)");

    const member = await guild.members.fetch(args.uid[0]);
    if (!member) return message.reply(":x: )- UID user not found");

    db.prepare(
      "INSERT OR REPLACE INTO users (id, whitelisted) VALUES (?, ?)",
    ).run(args.uid[0], args.tof[0]);

    return message.reply(
      `+ )- <@${args.uid[0]}> is now ${Boolean(args.tof[0]) ? "whitelistted" : "blacklisted"}`,
    );
  }

  /**
   * Expected: CID(1!) & TOF(?=1)
   * CID: The channel for counting.
   * TOF: If counting is enabled.
   */
  if (command === "setcounting") {
    const data = findOrInsertUser(message.author.id);
    if (!data.whitelisted)
      return message.reply(":x: )- You can't use this command.");
    
    const args = getArguments(message.content);
    let enable = true;
    if (!args.cid[0]) return message.reply(":x: )- CID(1!)");
    if (args.tof[0] === 0) enable = false;

    const channel = await guild.channels.fetch(args.cid[0]);
    if (!channel) return message.reply(":x: )- Channel not found.");

    jdb.push("/counting/enabled", enable);
    jdb.push("/counting/channel", channel.id);
    jdb.push("/counting/count", 0);
    jdb.push("/counting/previous/message", "");
    jdb.push("/counting/previous/user", clientId);

    message.reply(`Set ${channel} as the counting channel.`);

    const starting = new EmbedBuilder()
    .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
    .setTitle("Counting!")
    .setDescription(`Time to count! Start from **1** to Infinity!`)
    .setColor("Blurple")
    .setTimestamp();

    return channel.send({ embeds: [starting] });
  }

  /**
   * Expected: CID(1!) & TOF(?=1)
   * CID: The channel to create the webhook in.
   * TOF: To enable logging or not to. (Default true)
   */
  if (command === "setlog") {
    const data = findOrInsertUser(message.author.id);
    if (!data.whitelisted)
      return message.reply(":x: )- You can't use this command.");

    const args = getArguments(message.content);
    let enable = true;
    if (!args.cid[0]) return message.reply(`:x: )- CID(1!)`);
    if (args.tof[0] === 0) enable = false;

    const msg = await message.channel.send("Editing database...");
    let webhook;

    if (enable) {
      await msg.edit("Creating webhook...");
      const channel = await guild.channels.fetch(args.cid[0]);
      if (!channel) return msg.edit(`:x: )- Target channel not found`);

      webhook = await channel
        .createWebhook({ name: "Veloria Logs", reason: "Command used." })
        .catch(console.error);
    }

    db.prepare(
      "INSERT OR REPLACE INTO bot (id, logEnabled, logWebhook) VALUES (?, ?, ?)",
    ).run(client.user.id, enable ? 1 : 0, enable ? webhook.url : "");

    const presistent = `${enable ? `Enabled logging at ${args.cid[0]} using webhook ${webhook.id}` : "Disabled logs"}`;

    if (enable) {
      msg.edit(`${presistent}\n- Sending a message using webhook.`);

      webhook.send(
        `Enabled, Veloria will now start logging any activities, actions or button clicks.`,
      );
      return msg.edit(`${presistent}\n- Message sent.`);
    }

    return msg.edit(presistent);
  }

  /**
   * Expected: CID(1!)
   * CID: Channel to send the information message to
   */
  if (command === "information") {
    const result = findOrInsertUser(message.author.id);
    const args = getArguments(message.content);

    if (!args.cid[0]) message.reply(":x: )- CID(1!)");

    if (!result.whitelisted)
      return message.reply(`:x: )- You can't use this command.`);

    // Since the only check needed for this command is checkec
    // Build the message, to send.
    const attachment = new AttachmentBuilder("./files/welcome.png", {
      name: "welcome.png",
    });

    const header_image = new EmbedBuilder()
      .setImage("attachment://welcome.png")
      .setColor("2C2F33");

    const main_embed = new EmbedBuilder()
      .setTitle("Welcome to 𝓥𝓮𝓵𝓸𝓻𝓲𝓪")
      .setDescription(
        "> A warm and friendly community where **everyone is welcome!**\nOur goal is simple: to create a **safe**, **fun space to connect**, relax, and just hang out. Come **share your day**, your hobbies, or just lurk—-we're **happy you're here!** <:Giveaway:1448037405578891355>",
      )
      .setColor("2C2F33");

    const button_row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("info-rules")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Rules")
        .setEmoji({ id: "1448672796707389482" }),
      new ButtonBuilder()
        .setCustomId("info-guide")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Guide")
        .setEmoji({ id: "1448672735201984597" }),
    );

    const select_row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("info-select")
        .setPlaceholder("More informations...")
        .setMaxValues(1)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Moderation Guide")
            .setDescription("Information about moderation infractions.")
            .setEmoji({ id: "1448675316875919466" })
            .setValue("mod-guide"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Levels & Perks")
            .setDescription(
              "Information about levels and the perks given by levels.",
            )
            .setEmoji({ id: "1448675545696178300" })
            .setValue("level-perks"),
        ),
    );

    const channel = await guild.channels.fetch(args.cid[0]);
    if (!channel) message.reply(":x: )- CID channel not found.");
    return channel.send({
      embeds: [header_image, main_embed],
      components: [button_row, select_row],
      files: [attachment],
    });
  }

  /**
   * Expected: UID(!1)
   * UID: The user settings to pull.
   */
  if (command === "getsettingsfor") {
    const args = getArguments(message.content);
    if (!args.uid[0]) return message.reply(":x: )- CID(!1)");

    const data = findOrInsertUser(args.uid[0]);
    const embed = new EmbedBuilder()
      .setDescription(
        `
      ${codeBlock(`SELECT * FROM users WHERE id = ${args.uid[0]}`)}
      \n\n
      ${codeBlock(`{ id: "${data.id}", whitelisted: "${data.whitelisted}" }`)}
      `,
      )
      .setColor("2C2F33");

    return message.reply({
      embeds: [embed],
    });
  }
});

// Counting logic
client.on("messageCreate", async (message) => {
  const data = await jdb.getObject("/counting");

  if (!data.enabled) return;
  if (message.channel.id != data.channel) return;

  if (message.author.id === clientId) return;
  if (!Number(message.content)) return message.delete();


  const current = data.count;
  const next = current + 1;

  if (Number(message.content) === next) {
    if (data.previous.user === message.author.id) {
      await message.delete();
      const msg = await message.channel.send(`:x: )- ${message.author} You get only one chance to count! Wait till someone else counts!`);
      await sleep(5_000);
      return await msg.delete();
    }

    await jdb.push("/counting/count", next);

    message.react({ id: "1449052599654547518" });
    
    if (data.previous) {
      const prev = await message.channel.messages.fetch(data.previous);

      if (prev) 
        prev.delete();
    }

    const prev = await message.channel.send(`${message.author} counted **${next}**!`);
    await jdb.push("/counting/previous/message", prev.id);
    await jdb.push("/counting/previous/user", message.author.id)
  } else {
    await message.delete();
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    sendAction(
      "INTERACTION_BUTTON_CLICK_HANDLE",
      `@ ${interaction.user}\n\'#\ ${interaction.channel}\n(*) ${interaction.customId}`,
    );

    if (interaction.customId === "info-rules") {
      const embed = new EmbedBuilder()
        .setTitle("<:guidelines_tts:1448672796707389482> Policies & Rules")
        .setDescription(rules)
        .setColor("2C2F33");

      const footer_embed = new EmbedBuilder().setDescription(
        `<:punishment:1448675316875919466> **NOTE: You are expected to follow the rules listed above.**\n> If you have any questions regarding a rule ask a moderator.`,
      );

      return interaction.reply({
        embeds: [embed, footer_embed],
        flags: [MessageFlags.Ephemeral],
      });
    } else if (interaction.customId === "info-guide") {
      const embed = new EmbedBuilder().setDescription(guide).setColor("2C2F33");

      return interaction.reply({
        embeds: [embed],
        flags: [MessageFlags.Ephemeral],
      });
    }
  }

  if (interaction.isStringSelectMenu()) {
    sendAction(
      "INTERACTION_STRING_SELECT_HANDLE",
      `@ ${interaction.user}\n\'#\ ${interaction.channel}\n(*) ${interaction.customId}\n(*v) ${JSON.stringify(interaction.values)}`,
    );

    if (interaction.customId === "info-select") {
      const selected = interaction.values[0];

      if (selected === "mod-guide") {
        const embed = new EmbedBuilder()
          .setTitle(
            "<:moderation:1448675316875919466> Moderation Infractions Guide",
          )
          .setDescription("empty for now")
          .setColor("2C2F33");

        return interaction.reply({
          embeds: [embed],
          flags: [MessageFlags.Ephemeral],
        });
      }

      if (selected === "level-perks") {
        const embed = new EmbedBuilder()
          .setDescription(perks)
          .setColor("2C2F33");

        return interaction.reply({
          embeds: [embed],
          flags: [MessageFlags.Ephemeral],
        });
      }
    }
  }
});

/**
 * Get command arguments passed by users.
 * @param {string} content
 */
function getArguments(content) {
  /**
   * @type {{uid:string[],cid:string[],tof:number[]}}
   */
  const final = {
    uid: [],
    cid: [],
    tof: [],
  };

  // Get all the arguments, and remove the first element.
  const args = content.split(" ").slice(1);

  // Go through each argument.
  for (const arg of args) {
    const part = arg.split("(");

    if (part[0] === "uid") {
      final.uid.push(part[1].replace(")", ""));
    }

    if (part[0] === "cid") {
      final.cid.push(part[1].replace(")", ""));
    }

    if (part[0] === "tof") {
      final.tof.push(Number(part[1].replace(")", "")));
    }
  }

  return final;
}

// Database functions

/**
 * @param {string} userId
 * @param {{whitelisted:boolean}} optionals
 * @returns {{id:string,whitelisted:number}}
 */
function findOrInsertUser(userId, optionals = { whitelisted: 0 }) {
  const transaction = db.transaction(() => {
    console.info(`[DB] UPSERT_USER - Checking if user exists`);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

    if (user) {
      console.info(`[DB] UPSERT_USER - Found user`);
      return user;
    } else {
      console.info(`[DB] UPSERT_USER - User not found... Creating a new user.`);

      db.prepare("INSERT INTO users (id, whitelisted) VALUES (?, ?)").run(
        userId,
        optionals.whitelisted,
      );

      return { id: userId, whitelisted: 0 };
    }
  });

  return transaction();
}

/**
 * Send an action log.
 */
function sendAction(ACTION_TYPE, DESCRIPTION) {
  const data = db.prepare("SELECT * FROM bot WHERE id = ?").get(clientId);

  if (!data) return;
  if (!data.logEnabled) return;

  const webhook = new WebhookClient({ url: data.logWebhook });
  if (!webhook) return;

  const embed = new EmbedBuilder()
    .setTitle(ACTION_TYPE)
    .setDescription(DESCRIPTION)
    .setColor("Orange")
    .setTimestamp();

  return webhook.send({ embeds: [embed] });
}

/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

process.on("uncaughtException", (error, origin) => {
  console.error(error, origin);
  sendAction("BOT_PROCESS_UNCAUGHT_EXPECTION", `${error}`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(reason, promise);
  sendAction("BOT_PROCESS_UNHANDLED_REJECTION", `${reason}`);
});

client.on("error", (error) => {
  console.error(error);
  sendAction("BOT_DISCORD-JS_ERROR", `${error}`);
});

client.login(process.env.TOKEN);