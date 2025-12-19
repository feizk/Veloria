const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config");
const { normalize, matchScore } = require("../helpers/utils.js");

module.exports = {
  name: Events.MessageCreate,

  /**
   * @param {import("discord.js").Message} message
   */
  run: async (message) => {
    // Ignore bot commands
    if (message.author.bot) return;

    if (message.reference?.messageId) {
      const _COLOR = 0x2ecc71;
      const replied = await message.fetchReference().catch(() => null);

      if (replied) {
        const embed = replied.embeds.at(0);

        if (embed && embed.data?.footer?.text.includes("trivia")) {
          if (embed.data?.color === _COLOR) return;
          // ^ Already answered

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
                .setColor(_COLOR)
                .setTimestamp();

              await replied.edit({ embeds: [nEmbed] });
            }

            return message.reply(
              `${message.author} you are correct!\n- "**${correct}**" is the full correct answer!`,
            );
          }

          const pickedWrongOption =
            normalizedIncorrect.includes(normalizedInput);
          const overlapScore = matchScore(normalizedCorrect, normalizedInput);
          const closeToCorrect = overlapScore >= 0.5 && overlapScore < 1;

          if (pickedWrongOption) {
            await message.react("❌");
            return message.reply(
              `:x: | That's one of the options, but the wrong one!`,
            );
          }

          if (closeToCorrect) {
            await message.react("❌");
            return message.reply(":x: | Very close!");
          }

          await message.react("❌");
          return message.reply(":x: | Incorrect!");
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
