const { EmbedBuilder } = require("discord.js");
const { getArgs, validateID } = require("../../../helpers/message");
const { PRESETS } = require("../../../helpers/replies");
const Guild = require("../../../models/Guild");
const User = require("../../../models/User");

/**
 * Expected Arguments: boolean(1) / channel(1)
 * boolean; IF bump reminder should be enabled
 * channel; The bump reminder channel
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const args = getArgs(message.content);
  const enabled = args.result.boolean.at(0)?.value;
  let channelId = args.result.channel.at(0)?.value;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.displayAvatarURL(),
    })
    .setTimestamp()
    .setColor("Blurple");

  if (typeof enabled === "undefined") {
    embed
      .setDescription(`:x: | Argument **boolean** is required.`)
      .setColor("Orange");

    return message.reply({ embeds: [embed] });
  }

  if (enabled && !channelId) channelId = message.channelId;

  if (enabled && !validateID(channelId)) {
    embed
      .setDescription(":x: | Invalid discord channel ID.")
      .setColor("Orange");

    return message.reply({ embeds: [embed] });
  }

  try {
    const guildData = await Guild.findOne({ id: message.guildId });

    if (!guildData) {
      await Guild.create({ id: message.guildId });

      embed
        .setDescription(`🔂 | Please run this command again.`)
        .setColor("Orange");

      return message.reply({ embeds: [embed] });
    }

    if (!enabled) {
      await guildData.updateOne({ bump: { enabled: false } });

      embed.setDescription(`✅ | Disabled bump reminders.`);

      return message.reply({ embeds: [embed] });
    }

    let valid = true;
    await message.guild.channels.fetch(channelId).catch((_) => {
      valid = false;
    });

    if (!valid) {
      embed.setDescription(`:x: | Invalid discord channel.`).setColor("Red");

      return message.reply({ embeds: [embed] });
    }

    await guildData.updateOne({ bump: { enabled: true, channelId } });

    embed.setDescription(
      `✅ | Enabled bump reminders.\n- Use **/bump** at <#${channelId}> to start reminders!`,
    );

    return message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("ERROR", error);
    message.reply(`Error ${error}`);
  }
};
