const { prefix } = require("../config.json");
module.exports = {
  name: "credits",
  description: "List all of the people who helped (directly and indirectly)",
  aliases: ["cred", "creds", "cr"],
  usage: "[command name]",
  cooldown: 5,
  execute(message, args, client) {
    const data = [];
    data.push("Here's a list of all the people who helped:");
    data.push(
      "Firstly, all the beta testers who were here from the start. They were there when this bot was nothing more than just a handful of underdeveloped commands.\nSecondly, all the active users and members in the support server. \nThird, all the updaters for helping in updating the data.\nFourth, the makers of BTD 6 Index and advanced popology. Lastly, you, for reading this."
    );
    data.push(
      "join this server for support and info about this bot as well as when the bot is offline! https://discord.gg/8agRm6c"
    );
    return message.author
      .send(data, { split: true })
      .then(() => {
        if (message.channel.type === "dm") return;
        message.reply("I've sent you a DM with the credits");
      })
      .catch(error => {
        console.error(
          `Could not send help DM to ${message.author.tag}.\n`,
          error
        );
        message.reply("it seems like I can't DM you!");
      });
  }
};
