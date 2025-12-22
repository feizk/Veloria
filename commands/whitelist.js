const config = require("../config");
const { getArgs } = require("../helpers/message");
const User = require("../models/User");

/**
 * Expected Arguments: user(1) / boolean(1)
 * user; One user to whitelist
 * boolean; Whitelist or not
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  if (message.author.id != config.owner) return;

  const args = getArgs(message.content);
  const userId = args.getUser(0)?.value;
  let boolean = args.getBoolean(0)?.value;

  if (typeof boolean === "undefined") boolean = true;
  if (!userId) message.reply(`❌ | User argument is required`);

  const user = await message.guild.members.fetch(userId);
  if (!user) return message.reply(`❌ | Invalid userId provided`);

  try {
    const userData = await User.findOne({
      id: message.author.id,
      guild: message.guildId,
    });

    if (!userData) {
      await User.create({
        id: message.author.id,
        guild: message.guildId,
        whitelisted: boolean,
      });

      return message.reply(
        `✅ | Created user document. ${boolean ? "Whitelisted" : "Blacklisted"} user!`,
      );
    }

    await userData.updateOne({ whitelisted: boolean });

    return message.reply(
      `✅ | ${boolean ? "Whitelisted" : "Blacklisted"} ${user}`,
    );
  } catch (error) {
    console.error("ERROR", error);
    message.reply(`Error ${error}`);
  }
};
