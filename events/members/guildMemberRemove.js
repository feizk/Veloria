const { EmbedBuilder, AttachmentBuilder, Events } = require("discord.js");
const Guild = require("../../models/Guild");
const User = require("../../models/User");

module.exports = {
  name: Events.GuildMemberRemove,

  /**
   * @param {import("discord.js").GuildMember} member
   */
  run: async (member) => {
    const guildData = await Guild.findOne({ id: member.guild.id });

    if (!guildData) {
      return await Guild.create({ id: member.guild.id });
    }

    if (!guildData.goodbye?.enabled) return;
    if (!guildData.goodbye?.channelId) return;

    const bye_channel = await member.guild.channels.fetch(
      guildData.goodbye.channelId,
    );

    if (!bye_channel) return;

    const userData = await User.findOne({
      id: member.id,
      guild: member.guild.id,
    });

    if (!userData) {
      await User.create({ id: member.id, guild: member.guild.id });
    }

    const attachment = new AttachmentBuilder("./files/goodbye.png", {
      name: "goodbye.png",
    });

    const embed = new EmbedBuilder()
      .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() })
      .setImage("attachment://goodbye.png")
      .setDescription(`Goodbye **${member.user.username}**!`)
      .setColor("Blurple")
      .setTimestamp();

    return bye_channel.send({ embeds: [embed], files: [attachment] });
  },
};
