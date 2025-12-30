const { getArgs, validateID } = require("../../helpers/message");
const User = require("../../models/User");
const { MAX_MESSAGES_COUNT } = require("../../models/User");

/**
 * Arguments; user(1) number(1)
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const args = getArgs(message.content);
  const userId = args.result.user?.at(0)?.value;
  const count = args.result.number?.at(0)?.value;

  if (!userId || typeof count === "undefined")
    return message.reply(":x: | One of the two required arguments is missing");

  if (!validateID(userId))
    return message.reply(":x: | Invalid discord user ID");

  if (count >= MAX_MESSAGES_COUNT)
    return message.reply(
      `:x: | Message count must be below ${MAX_MESSAGES_COUNT.toString()}`,
    );

  try {
    let userData = await User.findOne({ id: userId, guild: message.guildId });
    if (!userData) {
      userData = await User.create({ id: userId, guild: message.guildId });
    }

    await userData.updateOne({ $inc: { messages: count } });

    return message.reply(
      `✅ | <@${userId}> message count is now set at **${userData.messages + count}**!`,
    );
  } catch (error) {
    console.error("ERROR", error);
    return message.reply(`Error ${error}`);
  }
};
