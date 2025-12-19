const { EmbedBuilder } = require("discord.js");
const he = require("he");
const { shuffle } = require("../helpers/utils");
const { getArgs } = require("../helpers/message");
const opentdb = require("../files/content/opentdb-data.json");

/**
 * @param {import("discord.js").Message} message
 */
module.exports = async (message) => {
  const args = getArgs(message.content);

  let fullURL = "https://opentdb.com/api.php?amount=1";
  const category = args.getCustom("category")?.at(0)?.value;
  const difficulty = args.getCustom("difficulty")?.at(0)?.value;
  const _type = args.getCustom("type")?.at(0)?.value;

  if (category) {
    const result = opentdb.trivia_categories.find(
      (i) =>
        i.id === Number(category) ||
        i.name.toLowerCase() === category.toLowerCase(),
    );

    if (!result) {
      return message.reply(`:x: | Argument category is not valid`);
    }

    fullURL += `&category=${result.id}`;
  }

  if (difficulty) {
    if (!opentdb.difficulties.includes(difficulty.toLowerCase())) {
      return message.reply(
        `:x: | Invalid difficulty -> ${opentdb.difficulties.join(", ")}`,
      );
    }

    fullURL += `&difficulty=${difficulty.toLowerCase()}`;
  }

  if (_type) {
    if (!opentdb.types.includes(_type.toLowerCase())) {
      return message.reply(`:x: | Invalid type -> ${opentdb.types.join(", ")}`);
    }

    fullURL += `&type=${_type.toLowerCase()}`;
  }

  try {
    const data = await fetch(fullURL);
    if (!data) return message.reply(":x: | API error (r)");

    const json = await data.json();
    if (!json) return message.reply(":x: | API error (j)");

    const result = json.results[0];
    if (!result)
      return message.reply(`:x: | No data found for these parameters`);

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
