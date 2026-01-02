const { getArgs, validateID } = require("../../../helpers/message");
const { PRESETS } = require("../../../helpers/replies");
const Guild = require("../../../models/Guild");
const User = require("../../../models/User");

/**
 * Arguments; boolean(1) / channel(1)
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const args = getArgs(message.content);
  const enabled = args.result.boolean?.at(0)?.value;
  let channelId = args.result.channel?.at(0)?.value;

  if (typeof enabled != "boolean")
    return message.reply(`:x: | Missing required arguments`);

  if (enabled && !channelId) channelId = message.channelId;

  if (enabled && !validateID(channelId))
    return message.reply(":x: | Invalid discord channel ID");

  try {
    const userData = await User.findOne({
      id: message.author.id,
      guild: message.guildId,
    });

    if (!userData || !userData?.whitelisted)
      return message.reply(PRESETS.NOT_WHITELISTED);

    const guildData = await Guild.findOne({ id: message.guildId });
    if (!guildData) {
      await Guild.create({ id: message.guildId });
      return message.reply(`🔂 | Please run this command again`);
    }

    if (!enabled) {
      await guildData.updateOne({ goodbye: { enabled, channelId: "" } });
      return message.reply(`✅ | Disabled goodbye module`)();
    }

    const channel = await message.guild.channels.fetch(channelId);
    if (!channel) return message.reply(`❌ | Invalid discord channel`);

    await guildData.updateOne({ goodbye: { enabled, channelId } });
    return message.reply("✅ | Enabled goodbye module");
  } catch (error) {
    console.error("ERROR", error);
    message.reply(`Error ${error}`);
  }
};
