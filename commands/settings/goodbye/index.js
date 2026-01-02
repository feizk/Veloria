const { EmbedBuilder } = require("discord.js");
const { getArgs } = require("../../../helpers/message");
const { PRESETS } = require("../../../helpers/replies");
const Guild = require("../../../models/Guild");
const User = require("../../../models/User");

/**
 * Arguments; show(help/settings)
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const args = getArgs(message.content);
  let show = args.getCustom("show")?.at(0)?.value;
  if (!show) show = "settings";

  // Show settings for "goodbye"
  if (show === "settings") {
    const userData = await User.findOne({
      id: message.author.id,
      guild: message.guildId,
    });

    if (!userData || !userData.whitelisted)
      return message.reply(PRESETS.NOT_WHITELISTED);

    const guildData = await Guild.findOne({ id: message.guildId });
    if (!guildData) {
      await Guild.create({ id: message.guildId });
      return message.reply(`:x: | No data found for this server!`);
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
      .setDescription(
        `## -> Goodbye Module\n**Status:** ${guildData.goodbye.enabled ? "Enabled" : "Disabled"}\n**Channel:** <#${guildData.goodbye.channelId}>`,
      )
      .setColor("Blurple")
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // Show help menu for goodbye commands
  if (show === "help") {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setDescription(
        `## -> Goodbye Module Help
        \n\nQ. **How to enable goodbye module?**
        \n- A. Use v?settings-goodbye-enable
        \n    **enable** sub-command accepts a **boolean** argument and a **channel** argument.
        \n    **boolean** argument is required (values: true/false/1/0)
        \n    **channel** argument is optional (values: text-channel-id) (defaults: command-channel)
        \n  e.g: v?settings-goodbye-enable boolean(true)
        \n\nQ. **How to see current settings?**
        \n- A. Use v?settings-goodbye
        \n    **goodbye** sub-command accepts a **show** argument
        \n    **show** argument is optional (values: help/settings) (defaults: settings)
        \n\nQ. **What is the purpose of the** show **argument?**
        \n- A. If the show argument is present and with a valid value, it will show the respective content.
        `,
      )
      .setColor("Blurple")
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};
