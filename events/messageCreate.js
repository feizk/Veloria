const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config");
const {
  normalize,
  matchScore,
  calculateScore,
  getRandomInt,
} = require("../helpers/utils.js");
const User = require("../models/User.js");
const Guild = require("../models/Guild.js");

module.exports = {
  name: Events.MessageCreate,

  /**
   * @param {import("discord.js").Message} message
   */
  run: async (message) => {
    // Bump Logic
    if (
      message.inGuild() &&
      message.author.id === config.disboardId &&
      message?.embeds
    ) {
      const embed = message.embeds.at(0);

      if (embed.description?.toLowerCase().includes("bump done")) {
        try {
          const guildData = await Guild.findOne({ id: message.guildId });
          if (!guildData) return;
          if (!guildData.bump_channel) return;
          if (message.channelId != guildData.bump_channel) return;

          const user = message.interactionMetadata.user;
          const nextBumpAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

          guildData.next_bump = nextBumpAt;
          await guildData.save();

          const bembed = new EmbedBuilder()
            .setAuthor({
              name: user.username,
              iconURL: user.displayAvatarURL(),
            })
            .setDescription(
              `**Thank you for bumping!**\n- I will remind to bump in 2 hours`,
            )
            .setTimestamp()
            .setColor("Blurple");

          return message.channel.send({
            content: user.toString(),
            embeds: [bembed],
            allowedMentions: { parse: ["users", "roles"] },
          });
        } catch (error) {
          console.error(`ERROR`, error);
        }
      }
    }

    // Ignore bots
    if (message.author.bot) return;

    if (message.reference?.messageId) {
      const CORRECT_COLOR = 0x2ecc71;
      const INCORRECT_COLOR = 0xe74c3c;
      const replied = await message.fetchReference().catch(() => null);

      if (replied) {
        const embed = replied.embeds.at(0);

        // Trivia
        if (embed && embed.data?.footer?.text.includes("trivia")) {
          if (
            embed.data?.color === CORRECT_COLOR ||
            embed.data?.color === INCORRECT_COLOR
          )
            return;
          // ^ Already answered

          let userData = await User.findOne({
            id: message.author.id,
            guild: message.guildId,
          });
          if (!userData)
            userData = await User.create({
              id: message.author.id,
              guild: message.guildId,
            });
          if (userData) {
            await userData.updateOne({ $inc: { "trivia.played": 1 } });
          }

          const encoded = embed.data.description;
          const decoded = Buffer.from(encoded, "base64").toString("utf-8");
          const correct = decoded.split(";").at(0).toString();
          const incorrects = decoded.split(";").at(1).split(",");

          const normalizedInput = normalize(message.content);
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

            const wpoints = calculateScore(normalizedInput, normalizedCorrect);

            if (userData) {
              await userData.updateOne({
                $inc: { "trivia.wins": 1, "trivia.score": wpoints },
              });
            }

            return message.reply(
              `${message.author} you are correct. You gained +${wpoints}\n- "**${correct}**" is the full correct answer!`,
            );
          }

          if (replied.editable) {
            const nEmbed = EmbedBuilder.from(embed)
              .setDescription(`🔂 | You got the wrong answer!`)
              .setColor(INCORRECT_COLOR)
              .setTimestamp();

            await replied.edit({ embeds: [nEmbed] });
          }

          const lpoints = getRandomInt(15, 50);

          if (userData) {
            await userData.updateOne({
              $inc: {
                "trivia.loss": 1,
                "trivia.score": -lpoints,
              },
            });
          }

          return message.reply(
            `:x: | Incorrect. You lost **${lpoints}** points`,
          );
        }
      }
    }

    // Commands
    if (message.content.startsWith(config.prefix)) {
      // Command's can't be used in guilds
      if (!message.inGuild()) return;

      console.info("INFO command used by", message.author.username);

      const msgwp = message.content.substring(config.prefix.length).trim();
      if (msgwp.length === 0) return;

      const command = msgwp.split(" ")[0].toLowerCase();

      try {
        let fullPath = "../commands";

        for (const path of command.split("-")) {
          fullPath += `/${path}`;
        }

        require(fullPath)(message);
      } catch (error) {
        console.error("ERROR", error);
      }
    }
  },
};
