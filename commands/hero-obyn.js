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
    let name = "obyn-greenfoot";
    let level = parseInt(args[0]);
    fetch(url, settings)
      .then(res => res.json())
      .then(json => {
        let object = json[`${name}`].upgrades[level - 1];

        if (!object)
          return message.channel.send("Please specify a valid hero level!");
        hardcost = Math.round((object.cost * 1.08) / 5) * 5;
        const embed = new Discord.RichEmbed()
          .setTitle(`${name} level ${level}`)
          .addField("cost/'xp'", `${object.xp}`)
          .addField("desc", `${object.notes}`)
          .setColor(colour)
          .setFooter(
            "d:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration"
          );
        message.channel.send(embed);
      });
  }
};
