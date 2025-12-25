const { EmbedBuilder } = require("discord.js");
const opentdb = require("../../files/content/opentdb-data.json");

/**
 * @param {import("discord.js").Message} message
 */
module.exports = (message) => {
  const categories = opentdb.trivia_categories
    .map((category) => {
      return `-----\n- Name: **${category.name}**\n- ID: ${category.id}`;
    })
    .join("\n");

  const embed = new EmbedBuilder()
    .setDescription(
      `*You can use either name or id when reffering to a category.*\n\n${categories}`,
    )
    .setTimestamp()
    .setColor("Blurple");

  return message.reply({ embeds: [embed] });
};
