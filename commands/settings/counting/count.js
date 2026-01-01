const { getArgs } = require("../../../helpers/message");
const { PRESETS } = require("../../../helpers/replies");
const Guild = require("../../../models/Guild");
const User = require("../../../models/User");

/**
 * Expected Arguments; number(1)
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
  const number = args.result.number.at(0)?.value;

  if (!number) return message.reply(":x: | Argument number is required");
  if (isNaN(number))
    return message.reply(":x: | Argument number provided yet, number is NaN");

  try {
    const guildData = await Guild.findOne({ id: message.guildId });

    if (!guildData) {
      await Guild.create({ id: message.guildId, counting: { count: number } });
      return message.reply(
        `✅ | Created guild document. Saved counting number`,
      );
    }

    if (!guildData.counting.enabled)
      return message.reply(":x: | Counting is disabled");

    await guildData.updateOne({ "counting.count": number });

    return message.reply(`✅ | Changed the counting value to ${number}`);
  } catch (error) {
    console.error("ERROR", error);
    message.reply(`Error ${error}`);
  }
};
