const { Events } = require("discord.js");
const { sendLog } = require("../../helpers/message");
const Guild = require("../../models/Guild");

module.exports = {
  name: Events.MessageDelete,

  /**
   * @param {import("discord.js").Message} message
   */
  run: async (message) => {
    await sendLog(message.guild, {
      action: `MESSAGE_DELETE`,
      extra: `${message.cleanContent}`,
      footer: `mid: ${message.id} aid: ${message.author.id}`,
    });

    const guildData = await Guild.findOne({ id: message.guildId });
    if (!guildData) return;

    if (guildData.counting.enabled) {
      if (message.channelId != guildData.counting.channel) return;

      if (Number(message.content) === guildData.counting.count) {
        return message.channel.send(
          `${message.author} | Please don't delete your message.\n> Continue from ${guildData.counting.count}`,
        );
      }
    }
  },
};
