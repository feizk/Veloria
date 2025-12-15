const { getArgs } = require("../../helpers/message");
const { PRESETS } = require("../../helpers/replies");
const Guild = require("../../models/Guild");
const User = require("../../models/User");

/**
 * Expected Arguments:
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const userData = await User.findOne({ id: message.author.id });

  if (!userData) return message.reply(PRESETS.USER_DATA_UNDEFINED);
  if (!userData.whitelisted) return message.reply(PRESETS.NOT_WHITELISTED);

  const args = getArgs(message.content);
  const number = args.result.number.at(0)?.value;

  if (!number) return message.reply(":x: | Argument number is required");
  if (isNaN(number))
    return message.reply(":x: | Argument number provided yet, number is NaN");

  try {
    const guildData = await Guild.findOne({ id: message.guildId });
    if (!guildData) {
      await Guild.create({ id: message.guildId });
      return message.reply(`:x: | Execute this command again`);
    }

    if (!guildData.counting.enabled)
      return message.reply(":x: | Counting is disabled");

    guildData.counting.count = number;
    await guildData.save();

    message.reply(`✅ | Changed the counting value to ${number}`);
  } catch (error) {
    console.error("ERROR", error);
    message.reply(`Error ${error}`);
  }
};
