const h = require("../jsons/heroes.json");
const { colour } = require("../shh/config.json");
const Discord = require("discord.js");
module.exports = {
  name: "gwen",
  description: "gwen upgrades",
  aliases: ["g", "G", "gwendolyn", "scientist", "gwendolin", "gwend", "gwendo"],
  usage: "!gwen <level>",
  execute(message, args, client) {
    if (!args) {
      return message.channel.send(
        `Please specify a level \`\`e.g.: ${message.content} 4\`\``
      );
    }
    const hh = h["gwen"][parseInt(args[0])];
    if (!hh) return message.channel.send("Please specify a valid hero level!");
    const heroEmbed = new Discord.RichEmbed()
      .setTitle("Gwen")
      .addField("cost", `${hh.cost}`)
      .addField("desc", `${hh.desc}`)
      .setFooter("use q!ap for help and elaboration")
      .setColor(colour);
    message.channel.send(heroEmbed);
  }
};
