const { Events, MessageFlags, EmbedBuilder } = require("discord.js");
const { rules } = require("../files/content/rules");
const { guide } = require("../files/content/guide");
const { perks } = require("../files/content/level");

module.exports = {
  name: Events.InteractionCreate,

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  run: (interaction) => {
    if (interaction.isButton()) {
      if (interaction.customId === "info-rules") {
        const embed = new EmbedBuilder()
          .setTitle("<:guidelines_tts:1448672796707389482> Policies & Rules")
          .setDescription(rules)
          .setColor("2C2F33");

        const footer_embed = new EmbedBuilder().setDescription(
          `<:punishment:1448675316875919466> **NOTE: You are expected to follow the rules listed above.**\n> If you have any questions regarding a rule ask a moderator.`,
        );

        return interaction.reply({
          embeds: [embed, footer_embed],
          flags: [MessageFlags.Ephemeral],
        });
      } else if (interaction.customId === "info-guide") {
        const embed = new EmbedBuilder()
          .setDescription(guide)
          .setColor("2C2F33");

        return interaction.reply({
          embeds: [embed],
          flags: [MessageFlags.Ephemeral],
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "info-select") {
        const selected = interaction.values[0];

        if (selected === "mod-guide") {
          const embed = new EmbedBuilder()
            .setTitle(
              "<:moderation:1448675316875919466> Moderation Infractions Guide",
            )
            .setDescription("empty for now")
            .setColor("2C2F33");

          return interaction.reply({
            embeds: [embed],
            flags: [MessageFlags.Ephemeral],
          });
        }

        if (selected === "level-perks") {
          const embed = new EmbedBuilder()
            .setDescription(perks)
            .setColor("2C2F33");

          return interaction.reply({
            embeds: [embed],
            flags: [MessageFlags.Ephemeral],
          });
        }
      }
    }
  },
};
