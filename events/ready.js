const { Events } = require("discord.js");
const Guild = require("../models/Guild");
const config = require("../config");

module.exports = {
  name: Events.ClientReady,

  /**
   * @param {import("discord.js").Client} client
   */
  run: (client) => {
    // Bump remind message
    setInterval(async () => {
      const dues = await Guild.find({ "bump.next": { $lte: new Date() } });

      for (const due of dues) {
        due.bump.next = null;
        await due.save();

        const guild = await client.guilds.fetch(due.id);
        if (!guild) return;

        const channel = await guild.channels.fetch(due.bump.channelId);
        if (!channel) return;

        channel.send({
          content: `${config.bumpRemindRole} | Time to bump the server! Use /bump`,
          allowedMentions: { parse: ["roles", "users"] },
        });
      }
    }, 60 * 1000);
  },
};
