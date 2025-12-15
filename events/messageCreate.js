const { Events } = require("discord.js");
const config = require("../config");

module.exports = {
  name: Events.MessageCreate,

  /**
   * @param {import("discord.js").Message} message
   */
  run: async (message) => {
    // Ignore bot commands
    if (message.author.bot) return;

    if (message.content.startsWith(config.prefix)) {
      // Command's can't be used in guilds
      if (!message.inGuild()) return;

      console.info("INFO command used by", message.author.username);

      const msgwp = message.content.substring(config.prefix.length).trim();
      if (msgwp.length === 0) return;

      const command = msgwp.split(" ")[0].toLowerCase();

      if (command === "send-information") {
        require("../commands/send/information.js")(message);
      }

      if (command === "whitelist") {
        require(`../commands/whitelist.js`)(message);
      }

      if (command === "counting-enable") {
        require(`../commands/counting/enable.js`)(message);
      }

      if (command === "counting-count") {
        require("../commands/counting/count.js")(message);
      }

      if (command === "bump-channel") {
        require("../commands/bump-channel.js")(message);
      }
    }
  },
};
