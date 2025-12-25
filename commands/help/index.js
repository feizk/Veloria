const User = require("../../models/User");
const data = require("../../files/content/commands-data.json");
const { EmbedBuilder } = require("discord.js");

/**
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const userData = await User.findOne({
    id: message.author.id,
    guild: message.guildId,
  });

  if (!userData) {
    await User.create({
      id: message.author.id,
      guild: message.guildId,
    });
  }

  const commands = data.commands
    .map((command) => {
      return `${command.category.toLowerCase()}:${command.name}`;
    })
    .join(" **|** ");

  const embed = new EmbedBuilder()
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.displayAvatarURL(),
    })
    .setDescription(
      `*Displayed As: [category]:[command]*\nPrefix: **v?**\n\n${commands}`,
    )
    .setColor("Blurple")
    .setTimestamp();

  return message.channel.send({ embeds: [embed] });
};
