const { Events } = require("discord.js");
const Guild = require("../models/Guild");
const config = require("../config");

module.exports = {
  name: Events.ClientReady,

  /**
   * @param {import("discord.js").Client} client
   */
  run: (client) => {
    setInterval(async () => {
      const dues = await Guild.find({ next_bump: { $lte: new Date() } });

      for (const due of dues) {
        const channel = client.channels
          .fetch(due.bump_channel)
          .catch(() => null);

        if (channel) {
          channel.send(
            `${config.bumpRemindRole} | Time to bump the server! Use /bump`,
          );
        }

        due.next_bump = null;
        await due.save();
      }
    }, 60 * 1000);
  },
};
