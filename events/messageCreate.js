const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config");
const { normalize, matchScore } = require("../helpers/utils.js");
const User = require("../models/User.js");

module.exports = {
  name: Events.MessageCreate,

  /**
   * @param {import("discord.js").Message} message
   */
  run: async (message) => {
    // Ignore bot commands
    if (message.author.bot) return;

    if (message.reference?.messageId) {
      const CORRECT_COLOR = 0x2ecc71;
      const INCORRECT_COLOR = 0xe74c3c;
      const replied = await message.fetchReference().catch(() => null);

      if (replied) {
        const embed = replied.embeds.at(0);

        if (embed && embed.data?.footer?.text.includes("trivia")) {
          if (
            embed.data?.color === CORRECT_COLOR ||
            embed.data?.color === INCORRECT_COLOR
          )
            return;
          // ^ Already answered

          let userData = await User.findOne({ id: message.author.id });
          if (!userData) userData = await User.create({ id: message.author.id });
          if (userData) {
            await userData.updateOne({ $inc: { "trivia.played": 1 } });
          }

          const encoded = embed.data.description;
          const decoded = Buffer.from(encoded, "base64").toString("utf-8");
          const correct = decoded.split(";").at(0).toString();
          const incorrects = decoded.split(";").at(1).split(",");

          const normalizedInput = normalize(message.content);
          const normalizedIncorrect = incorrects.map(normalize);
          const normalizedCorrect = normalize(correct);
          const partial =
            normalizedInput.length >= 4 &&
            normalizedCorrect.includes(normalizedInput);
          const isCorrect =
            partial || matchScore(normalizedInput, normalizedCorrect) >= 0.6;

          if (isCorrect) {
            if (replied.editable) {
              const nEmbed = EmbedBuilder.from(embed)
                .setDescription(
                  `✨ | Answered By; ${message.author}\n- Try again, use "v?trivia"`,
                )
                .setColor(CORRECT_COLOR)
                .setTimestamp();

              await replied.edit({ embeds: [nEmbed] });
            }

            if (userData) {
              await userData.updateOne({ $inc: { "trivia.wins": 1 } });
            }

            return message.reply(
              `${message.author} you are correct!\n- "**${correct}**" is the full correct answer!`,
            );
          }

          if (replied.editable) {
            const nEmbed = EmbedBuilder.from(embed)
              .setDescription(`🔂 | You got the wrong answer!`)
              .setColor(INCORRECT_COLOR)
              .setTimestamp();

            await replied.edit({ embeds: [nEmbed] });
          }

          if (userData) {
            await userData.updateOne({ $inc: { "trivia.loss": 1 } });
          }

          return message.reply(":x: | Incorrect, you get one chance to try!");
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
