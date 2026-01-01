const { getArgs, validateID } = require("../../../helpers/message");
const { PRESETS } = require("../../../helpers/replies");
const Guild = require("../../../models/Guild");
const User = require("../../../models/User");

/**
 * Expected Arguments: boolean(1) / channel(1)
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const data = await User.findOne({
    id: message.author.id,
    guild: message.guildId,
  });

  if (!data) return message.reply(PRESETS.USER_DATA_UNDEFINED);
  if (!data.whitelisted) return message.react(PRESETS.NOT_WHITELISTED);

  const args = getArgs(message.content);
  const status = args.result.boolean.at(0);
  const channel = args.result.channel.at(0);

  // If argument not provided
  if (!status) return message.reply(PRESETS.REQUIRED_ARGS_UNDEFINED);
  // If status is truthy but channel argument is not provided
  if (status.value && !channel)
    return message.reply(
      `:x: | Args; boolean is truthy yet channel is undefined`,
    );

  // If status is true, then validate channel arg
  if (status.value) {
    // Arguments provided,
    // Check if arguments are valid
    if (!validateID(channel.value))
      return message.reply(`:x: | Invalid channel ID`);

    let valid = true;
    await message.guild.channels.fetch(channel.value).catch((error) => {
      valid = false;
      // If channel does not exist
      return message.reply(
        `:x: | The channel linked with the ID provided does not exist\n-> | ${error}`,
      );
    });

    if (!valid) return;
  }

  try {
    const guildData = await Guild.findOne({ id: message.guildId });

    if (!guildData) {
      await Guild.create({
        id: message.guildId,
        counting: {
          enabled: status.value,
          channel: status.value ? channel.value : "",
          count: 0,
        },
      });

      return message.reply(
        `✅ | Created guild document. Saved counting settings`,
      );
    }

    await guildData.updateOne({
      "counting.enabled": status.value,
      "counting.channel": status.value ? channel.value : "",
      "counting.count": 0,
    });

    return message.reply(
      `✅ | ${status.value ? `Enabled counting. Start counting at <#${channel.value}>` : "Disabled counting"}`,
    );
  } catch (error) {
    console.error("ERROR", error);
    message.reply(`Error ${error}`);
  }
};
