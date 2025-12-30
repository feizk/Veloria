const {
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { getArgs } = require("../../helpers/message");
const { PRESETS } = require("../../helpers/replies");
const User = require("../../models/User");

/**
 * Arguments; channel(1)
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const args = getArgs(message.content);
  let channelId = args.result.channel?.at(0)?.value;
  if (!channelId) channelId = message.channel.id;

  const userData = await User.findOne({
    id: message.author.id,
    guild: message.guildId,
  });

  if (!userData) {
    await User.create({ id: message.author.id, guild: message.guildId });

    return message.reply(PRESETS.USER_DATA_UNDEFINED);
  }

  if (!userData.whitelisted) return message.reply(PRESETS.NOT_WHITELISTED);

  const channel = await message.guild.channels.fetch(channelId);
  if (!channel) return message.reply(":x: | Channel not found");

  const attachment = new AttachmentBuilder("./files/welcome.png", {
    name: "welcome.png",
  });

  const image = new EmbedBuilder()
    .setColor("Blurple")
    .setImage("attachment://welcome.png");

  const embed = new EmbedBuilder()
    .setTitle("Welcome to 𝓥𝓮𝓵𝓸𝓻𝓲𝓪")
    .setDescription(
      "> A warm and friendly community where **everyone is welcome!**\nOur goal is simple: to create a **safe**, **fun space to connect**, relax, and just hang out. Come **share your day**, your hobbies, or just lurk—-we're **happy you're here!** <:Giveaway:1448037405578891355>",
    )
    .setColor("Blurple");

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
          .setLabel("Levels & Perks")
          .setDescription(
            "Information about levels and the perks given by levels.",
          )
          .setEmoji({ id: "1448675545696178300" })
          .setValue("level-perks"),
      ),
  );

  return channel.send({
    embeds: [image, embed],
    components: [button_row, select_row],
    files: [attachment],
  });
};
