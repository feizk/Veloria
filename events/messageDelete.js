const { Events } = require("discord.js");
const { sendLog } = require("../helpers/message");

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
  },
};
