const { GuildAuditLogs } = require("discord.js");
const { getArgs } = require("../helpers/message");
const { PRESETS } = require("../helpers/replies");
const Guild = require("../models/Guild");
const User = require("../models/User");

/**
 * Expected Arguments: boolean(1) / channel(1)
 * boolean; IF bump reminder should be enabled
 * channel; The bump reminder channel
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const userData = await User.findOne({ id: message.author.id });
  if (!userData) return message.reply(PRESETS.USER_DATA_UNDEFINED);
  if (!userData.whitelisted) return message.reply(PRESETS.NOT_WHITELISTED);

  const args = getArgs(message.content);
  const enabled = args.result.boolean.at(0)?.value;
  const channelId = args.result.channel.at(0)?.value;

  if (typeof enabled === "undefined")
    return message.reply(
      ":x: | Argument boolean is required, if boolean is true then channel argument is required aswell",
    );

  if (enabled && !channelId)
    return message.reply(
      `:x: | Argument boolean is true, yet channel is not defined`,
    );

  let valid = false;
  await message.guild.channels.fetch(channelId).catch((err) => {
    valid = true;
    message.reply(`:x: | Invalid channel provided`);
    console.error("ERROR", err);
  });

  if (valid) return;

  try {
    const guildData = await Guild.findOne({ id: message.guildId });
    if (!guildData) {
      await Guild.create({ id: message.guildId });
      return message.reply(
        `⚠️ | There is no data found, execute this command again`,
      );
    }

    if (enabled) {
      guildData.bump_channel = channelId;
      await guildData.save();

      return message.reply(
        `✅ | Saved <#${channelId}> as Bump reminder channel. Execute /bump at channel to get started`,
      );
    } else {
      guildData.bump_channel = "";
      await guildData.save();

      return message.reply(`✅ | Disabled Bump reminder`);
    }
  } catch (error) {
    console.error("ERROR", error);
    message.reply(`Error ${error}`);
  }
};
