const {
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { getArgs } = require("../../helpers/message");
const { PRESETS } = require("../../helpers/replies");
const User = require("../../models/User");

/**
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const userData = await User.findOne({ id: message.author.id });
  if (!userData) return message.reply(PRESETS.USER_DATA_UNDEFINED);

  const args = getArgs(message.content);
  const channelId = args.result.channel.at(0)?.value;

  if (!channelId) message.reply(":x: | Argument channel is not defined");

  if (!userData.whitelisted) return message.reply(PRESETS.NOT_WHITELISTED);

  // Since the only check needed for this command is checked
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

  const channel = await guild.channels.fetch(channelId);
  if (!channel)
    message.reply(":x: | Argument channel, actual channel not found.");

  return channel.send({
    embeds: [header_image, main_embed],
    components: [button_row, select_row],
    files: [attachment],
  });
};
