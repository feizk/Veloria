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
} = require("discord.js");
const betterSQL = require("better-sqlite3");
const { rules } = require("./files/rules-content");

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

const owners = ["1143607268781342893"];

const db = betterSQL("db/veloria.db");
client.db = db;

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
  } catch (error) {
    console.error(error);
  }

  console.info(`V     Ready - ${client.user.username}`);
});

client.on("messageCreate", async (message) => {
  const prefix = "v?";
  if (!message.content.startsWith(prefix)) return;
  if (!message.guildId) return message.reply(":x: )- Disabled in DM's");

  const guild = message.guild;
  const ap = message.content.substring(prefix.length).trim();
  if (ap.length === 0) return;
  const command = ap.split(" ")[0].toLowerCase();

  console.info(`V     Command used ${command}`);

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

    if (!args.uid.at(0) || !args.tof.at(0))
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
        .setStyle(ButtonStyle.Success)
        .setLabel("Rules")
        .setEmoji({ id: "1448023325581508739" }),
    );

    const channel = await guild.channels.fetch(args.cid[0]);
    if (!channel) message.reply(":x: )- CID channel not found.");
    return channel.send({
      embeds: [header_image, main_embed],
      components: [button_row],
      files: [attachment],
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.customId === "info-rules") {
    const embed = new EmbedBuilder()
      .setTitle("Server Rules")
      .setDescription(rules)
      .setColor("2C2F33");

    const footer_embed = new EmbedBuilder().setDescription(
      `**NOTE: You are expected to follow the rules listed above.**\n> If you have any questions regarding a rule ask a moderator.`,
    );

    interaction.reply({
      embeds: [embed, footer_embed],
      flags: [MessageFlags.Ephemeral],
    });
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

process.on("uncaughtException", (error, origin) => {
    console.error(error, origin);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error(reason, promise);
});

client.on("error", (error) => {
    console.error(error);
});

client.login(process.env.TOKEN);