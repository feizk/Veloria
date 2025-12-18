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

    if (message.reference?.messageId) {
      const replied = await message.fetchReference().catch(() => null);

      if (replied) {
        const embed = replied.embeds.at(0);

        if (embed && embed.data.footer.text.includes("trivia")) {
          const encoded = embed.data.description;
          const decoded = Buffer.from(encoded, "base64").toString("utf-8");
          const correct = decoded.split(";").at(0).toString();
          const incorrects = decoded.split(";").at(1).split(",");

          if (message.content.toLowerCase() === correct.toLowerCase()) {
            return message.reply(`Correct! "${correct}" is the answer!`);
          }

          if (incorrects.includes(message.content.toLowerCase())) {
            return message.reply(`Wrong, but close!`);
          }

          return message.react("❌");
        }
      }
    }

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

      if (command === "logs-enable") {
        require("../commands/logs/enable.js")(message);
      }

      if (command === "bump-channel") {
        require("../commands/bump-channel.js")(message);
      }

      if (command === "trivia") {
        require("../commands/trivia.js")(message);
      }
    }
  },
};
