const { Events, EmbedBuilder } = require("discord.js");
const Guild = require("../models/Guild");
const User = require("../models/User");
const config = require("../config");

module.exports = {
  name: Events.ClientReady,

  /**
   * @param {import("discord.js").Client} client
   */
  run: (client) => {
    // Bump remind message
    setInterval(async () => {
      const dues = await Guild.find({ next_bump: { $lte: new Date() } });

      for (const due of dues) {
        due.next_bump = null;
        await due.save();

        const guild = await client.guilds.fetch(due.id);
        if (!guild) return;

        const channel = await guild.channels.fetch(due.bump_channel);
        if (!channel) return;

        channel.send({
          content: `${config.bumpRemindRole} | Time to bump the server! Use /bump`,
          allowedMentions: { parse: ["roles", "users"] },
        });
      }
    }, 60 * 1000);

    // Leaderboard message
    setInterval(async () => {
      console.debug(`DEBUG Started checks [LEADERBOARD]`);

      const guildData = await Guild.find({
        "leaderboard.enabled": true,
      }).lean();
      if (!guildData) return;

      for (const data of guildData) {
        console.debug(
          `DEBUG Checking if leaderboard is enabled for ${data.id}`,
        );

        if (!data.leaderboard?.enabled) return;
        if (!data.leaderboard?.channelId) return;

        const guild = await client.guilds.fetch(data.id).catch(() => {});
        if (!guild) return;

        const channel = await guild.channels
          .fetch(data.leaderboard.channelId)
          .catch(() => {});
        if (!channel) return;

        const tops = await User.find(
          { guild: data.id },
          {
            id: 1,
            "trivia.score": 1,
            "trivia.played": 1,
            "trivia.wins": 1,
            "trivia.loss": 1,
          },
        )
          .sort({ "trivia.score": -1 })
          .limit(15)
          .lean();

        const embed = new EmbedBuilder()
          .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
          .setFooter({ text: "updated every 5 minutes" })
          .setTimestamp()
          .setColor("Blurple");

        if (!tops.length) {
          embed.setDescription(`Not enough data to display...`);
        }

        console.info(tops);

        const ldb = tops
          .map((user, index) => {
            const rank = index + 1;
            return `**#${rank}** <@${user.id}> - **${user.trivia.score}** PTS`;
          })
          .join("\n");

        embed.setDescription(ldb ? ldb : "Not enough data to display...");

        // No prev messageID
        if (!data.leaderboard.messageId) {
          const msg = await channel.send({ embeds: [embed] });
          return await Guild.updateOne(
            { id: guild.id },
            { leaderboard: { messageId: msg.id } },
          );
        }

        const msg = await channel.messages.fetch(data.leaderboard.messageId);
        if (!msg) return;
        return msg.edit({ embeds: [embed] });
      }
    }, 30 * 1000);
  },
};
