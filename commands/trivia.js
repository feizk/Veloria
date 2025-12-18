const { EmbedBuilder } = require("discord.js");
const he = require("he");
const { shuffle } = require("../helpers/utils");

/**
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  try {
    const data = await fetch("https://opentdb.com/api.php?amount=1");
    if (!data) return message.reply(":x: | API error (r)");

    const json = await data.json();
    if (!json) return message.reply(":x: | API error (j)");

    const result = json.results[0];
    const type = result.type;
    const question = he.decode(result.question);
    const correct = he.decode(result.correct_answer);
    const incorrects = result.incorrect_answers.map((i) => he.decode(i));
    const category = he.decode(result.category);

    // [0=ans];[1=inc]
    const encoded = Buffer.from(`${correct};${incorrects.join(",")}`).toString(
      "base64",
    );

    const embed = new EmbedBuilder()
      .setTitle(`${category}`)
      .setDescription(`${encoded}`)
      .addFields({ name: "Question", value: question })
      .setColor("Blurple")
      .setFooter({ text: `trivia - opentdb / ${type}` });

    if (type === "multiple") {
      const choices = [...incorrects, correct];

      embed.addFields({
        name: "Choices",
        value: `- ${shuffle(choices).join("\n- ")}`,
      });
    }

    return message.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    message.reply(`Error ${error}`);
  }
};
