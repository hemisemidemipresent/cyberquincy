const h = require("../jsons/heroes.json");
const { colour } = require("../shh/config.json");
const Discord = require("discord.js");
module.exports = {
  name: "ezili",
  description: "ezili upgrades",
  aliases: ["e", "ez", "voodo", "vm", "ezi", "ezil"],
  usage: "!ezili <level>",
  execute(message, args, client) {
    if (!args) {
      return message.channel.send(
        `Please specify a level \`\`e.g.: ${message.content} 4\`\``
      );
    }
    const hh = h["ezili"][parseInt(args[0])];
    if (!hh) return message.channel.send("Please specify a valid hero level!");
    const heroEmbed = new Discord.RichEmbed()
      .setTitle("Ezili")
      .addField("cost", `${hh.cost}`)
      .addField("desc", `${hh.desc}`)
      .setFooter("use q!ap for help and elaboration")
      .setColor(colour);
    message.channel.send(heroEmbed);
  }
};
