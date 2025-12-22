const { getArgs, validateID } = require("../../helpers/message");
const { PRESETS } = require("../../helpers/replies");
const Guild = require("../../models/Guild");
const User = require("../../models/User");

/**
 * Expected Arguments: boolean(1) / channel(1)
 * boolean; Weather to enable logs
 * channel; required if boolean is true, the channel to send logs to
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const userData = await User.findOne({
    id: message.author.id,
    guild: message.guildId,
  });
  if (!userData) return message.reply(PRESETS.USER_DATA_UNDEFINED);
  if (!userData.whitelisted) return message.reply(PRESETS.NOT_WHITELISTED);

  const args = getArgs(message.content);
  const enable = args.result.boolean.at(0)?.value;
  const channelId = args.result.channel.at(0)?.value;

  if (typeof enable === "undefined")
    return message.reply(`:x: | Argument boolean is required`);
  if (enable && !channelId)
    return message.reply(
      ":x: | Argument boolean is truthy, yet channel is not defined",
    );
  if (!validateID(channelId))
    return message.reply(":x: | Argument channel is not a valid Discord ID");

  try {
    const guildData = await Guild.findOne({ id: message.guildId });
    if (!guildData) {
      await Guild.create({ id: message.guildId });
      return message.reply(`:x: | No data found, execute this command again`);
    }

    if (!enable) {
      guildData.bot_logs.enabled = false;
      guildData.bot_logs.channel = "";
      await guildData.save();

      return message.reply(`✅ | Disabled logging`);
    }

    let valid = true;
    await message.guild.channels.fetch(channelId).catch((err) => {
      valid = false;
      console.error("ERROR", err);
      message.reply(`Error ${err}`);
    });

    if (!valid)
      return message.reply(
        `:x: | Provided channel is not a channel in this guild`,
      );

    guildData.bot_logs.enabled = true;
    guildData.bot_logs.channel = channelId;
    await guildData.save();

    return message.reply(`✅ | Saved bot log setting`);
  } catch (error) {
    console.error("ERROR", error);
    message.reply(`Error ${error}`);
  }
};
