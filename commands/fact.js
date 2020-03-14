const fact = require("../jsons/fact.json");
module.exports = {
  name: "fact",
  description: "random fact/lore from the NK blog. BIG credit to it",
  aliases: ["random", "f"],
  usage: "[command name]",
  execute(message, args, client) {
    if (args[0] == undefined) {
      var randex = Math.ceil(Math.random() * 175);
    } else {
      var randex = parseInt(args[0]);
    }
    let fac = fact[`r${randex}`];
    message.channel.send(`${fac}`);
  }
};
