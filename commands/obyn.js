const h = require("../jsons/fact.json");
const { colour } = require("../config.json");
const Discord = require("discord.js");
module.exports = {
  name: "obyn",
  description: "obyn upgrades/cost",
  aliases: ["o", "O", "ocyn"],
  usage: "!obyn <level>",
  execute(message, args, client) {
    if (!args) {
      return message.channel.send(
        `Please specify a level \`\`e.g.: ${message.content} 4\`\``
      );
    }
    const hh = h["obyn"][parseInt(args[0])];
    const heroEmbed = new Discord.RichEmbed()
      .setTitle("Obyn")
      .addField("cost", `${hh.cost}`)
      .addField("desc", `${hh.desc}`)
      .setFooter("use q!ap for help and elaboration")
      .setColor(colour);
    message.channel.send(heroEmbed);
  }
};
