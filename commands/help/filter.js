const { getArgs } = require("../../helpers/message");
const data = require("../../files/content/commands-data.json");
const { EmbedBuilder } = require("discord.js");

/**
 * Expected Arguments;
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const args = getArgs(message.content);
  const command_name = args.getCustom("command")?.at(0)?.value;
  const command_category = args.getCustom("category")?.at(0)?.value;

  if (!command_name && !command_category) {
    return message.reply(`:x: | One Argument is at least required`);
  }

  if (command_name && command_category) {
    return message.reply(`:x: | You can only filter by one argument`);
  }

  const filtered = data.commands.filter((command) => {
    if (command_name && command.name === command_name) {
      return command;
    }

    if (
      command_category &&
      command.category.toLowerCase() === command_category.toLowerCase()
    )
      return command;
  });

  if (filtered.length === 0) {
    return message.reply(`:x: | Command matching that filter can't be found`);
  }

  const commands = filtered
    .map((command) => {
      let _args = "";
      if (command.arguments.length) {
        command.arguments.forEach((arg) => {
          _args += `---\n- Name: ${arg.name}\n- ACV: ${arg.accepted_value}\n`;
        });
      }

      return `------\n- Name: ${command.name}\n- Category: ${command.category}${_args ? `\n- Args:\n${_args}` : ""}`;
    })
    .join("\n");

  const embed = new EmbedBuilder()
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.displayAvatarURL(),
    })
    .setDescription(`## Filtered Results\n${commands}`)
    .setColor("Blurple")
    .setTimestamp();

  return message.reply({ embeds: [embed] });
};
