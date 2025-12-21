const { Events } = require("discord.js");
const Guild = require("../models/Guild");
const User = require("../models/User");
const { sleep } = require("../helpers/utils");
const config = require("../config");

/**
 * Counting increment logic
 */

module.exports = {
  name: Events.MessageCreate,

  /**
   * @param {import("discord.js").Message} message
   */
  run: async (message) => {
    if (!message.inGuild()) return;

    const data = await Guild.findOne({ id: message.guildId });

    if (!data) return;
    if (!data.counting.enabled) return;
    if (data.counting.channel != message.channelId) return;

    const users = await User.find({ whitelisted: true }).distinct("id");

    if (!users.includes(message.author.id)) {
      if (message.author.id === config.clientId) return;
      if (!Number(message.content)) return message.delete();
    }

    const current = data.counting.count;
    const next = current + 1;

    if (Number(message.content) === next) {
      if (
        !users.includes(message.author.id) &&
        data.counting.previous.user === message.author.id
      ) {
        await message.delete();
        const msg = await message.channel.send(
          `:x: | ${message.author} you can only count once at a time!`,
        );
        await sleep(5_000);
        return await msg.delete();
      }

      try {
        data.counting.count = next;
        data.counting.previous.user = message.author.id;
        await data.save();

        await message.react(config.counting_success);
      } catch (error) {
        console.error("ERROR", error);
      }
    }
  },
};
