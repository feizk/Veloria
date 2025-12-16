const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Guild = require("../models/Guild");

module.exports = {
  name: Events.MessageCreate,

  /**
   * @param {import("discord.js").Message} message
   */
  run: async (message) => {
    if (!message.inGuild()) return;
    if (!message.author.bot) return;
    if (message.author.id != config.disboardId) return;
    if (!message.embeds.length) return;

    const embed = message.embeds.at(0);
    if (!embed.description?.toLowerCase().includes("bump done")) return;

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
      });
    } catch (error) {
      console.error(`ERROR`, error);
    }
  },
};
