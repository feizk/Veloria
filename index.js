const { Client, GatewayIntentBits } = require("discord.js");
const mongoose = require("mongoose");
const process = require("node:process");
const fs = require("node:fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  allowedMentions: { repliedUser: false },
});

process.loadEnvFile(".env");

client.on("clientReady", async (client) => {
  console.info(`INFO ${client.user.username} is ready!`);

  try {
    console.info("INFO connecting to mongodb");

    await mongoose.connect(process.env.MONGODB);
    console.info("INFO connected to mongodb");
  } catch (error) {
    console.error("ERROR", error);
  }
});

(async () => {
  console.info("INFO fetching event files...");
  const files = fs.readdirSync("./events/");

  for (const content of files) {
    const stat = fs.statSync(`./events/${content}`);

    if (stat.isFile()) {
      const event = require(`./events/${content}`);

      if (!event.name)
        return console.warn("WARN missing event#name property in", content);

      if (!event.run)
        return console.warn("WARN missing event#run function in", content);

      client.on(event.name, (...args) => event.run(...args));
    } else {
      const files = fs.readdirSync(`./events/${content}/`);

      for (const file of files) {
        const stat = fs.statSync(`./events/${content}/${file}`);
        if (!stat.isFile()) return;

        const event = require(`./events/${content}/${file}`);

        if (!event?.name)
          return console.warn(`WARN missing event#name in ${content}/${file}`);

        if (!event?.run)
          return console.warn(`WARN missing event#run in ${content}/${file}`);

        client.on(event.name, (...args) => event.run(...args));
      }
    }
  }

  console.info("INFO completed reading events");
})();

process.on("uncaughtException", (error) => {
  console.error("ERROR", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("ERROR", reason);
});

process.on("warning", (warning) => {
  console.error("ERROR", warning);
});

client.on("warn", (message) => {
  console.warn("WARN", message);
});

client.login(process.env.TOKEN);
