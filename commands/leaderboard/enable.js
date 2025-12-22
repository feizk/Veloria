const { getArgs } = require("../../helpers/message");
const { PRESETS } = require("../../helpers/replies");
const Guild = require("../../models/Guild");
const User = require("../../models/User");

/**
 * Expected Arguments; boolean(1) / channel(1)
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const userData = await User.findOne({
    id: message.author.id,
    guild: message.guildId,
  });
  if (!userData) return message.reply(PRESETS.USER_DATA_UNDEFINED);
  if (!userData.whitelisted) return message.reply(PRESETS.USER_DATA_UNDEFINED);

  const args = getArgs(message.content);
  const enabled = args.result.boolean?.at(0)?.value;
  const channel = args.result.channel?.at(0)?.value;

  if (typeof enabled === "undefined")
    return message.reply(`:x: | Argument boolean is required`);
  if (enabled && !channel)
    return message.reply(
      `:x: | Argument channel is undefined, yet boolean is true`,
    );

  try {
    const guildData = await Guild.findOne({ id: message.guildId });
    if (!guildData) {
      await Guild.create({ id: message.guildId });
      return message.reply(`🔂 | Execute this command again`);
    }

    if (!enabled) {
      guildData.leaderboard.enabled = enabled;
      guildData.leaderboard.channelId = null;
      await guildData.save();

      return message.reply(`✅ | Saved leaderboard settings`);
    }

    guildData.leaderboard.enabled = enabled;
    guildData.leaderboard.channelId = channel;
    await guildData.save();

    return message.reply(
      `✅ | Enabled leaderboard. The leaderboard will be sent on the next interval`,
    );
  } catch (error) {
    console.error("ERROR", error);
    message.reply(`Error ${error}`);
  }
};
