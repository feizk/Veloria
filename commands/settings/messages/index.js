const { getArgs, validateID } = require("../../../helpers/message");
const User = require("../../../models/User");

/**
 * Arguments; user(1)
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const args = getArgs(message.content);
  let userId = args.result.user?.at(0)?.value;
  if (!userId) userId = message.author.id;

  if (!validateID(userId)) message.reply(`:x: | Invalid discord user ID`);

  const userData = await User.findOne({ id: userId, guild: message.guildId });
  if (!userData) {
    await User.create({ id: userId, guild: message.guildId });
  }

  return message.reply(
    `💬 | <@${userId}> has sent **${userData.messages}** messages in this server!`,
  );
};
