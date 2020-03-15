const Discord = require("discord.js");
const { colour } = require("../shh/config.json");
const fetch = require("node-fetch");
const url = "http://topper64.co.uk/nk/btd6/dat/towers.json";
const settings = { method: "Get" };
module.exports = {
  name: "mortar",
  description: "mortar upgrades desc",
  aliases: ["mor"],
  usage: "<path1> <path2> <path3>",
  execute(message, args, client) {
    if (!args[0]) {
      return message.channel.send(
        `The syntax of this command is q!${name} <path1><path2><path3>, i.e. q!${name} 003 would represent the third tier tower of the third path. **no crosspaths are accepted**, i.e. no more that one path should be inputted`
      );
    }
    let name = "mortar-monkey";
    var path1 = Math.floor(parseInt(args[0]) / 100);
    var path2 = Math.floor((parseInt(args[0]) - path1 * 100) / 10);
    var path3 = parseInt(args[0] - path1 * 100 - path2 * 10);
    if (path2 < 1 && path3 < 1) {
      var path = 1;
    } else if (path1 < 1 && path3 < 1) {
      var path = 2;
    } else if (path1 < 1 && path2 < 1) {
      var path = 3;
    }
    switch (path) {
      case 1:
        var tier = path1;
        break;
      case 2:
        var tier = path2;
        break;
      case 3:
        var tier = path3;
        break;
    }
    fetch(url, settings)
      .then(res => res.json())
      .then(json => {
        if (path == 0 || tier == 0 || args[0] == "base") {
          hardcost = Math.round((object.cost * 1.08) / 5) * 5;
          hardTotalCost = Math.round((totalCost * 1.08) / 5) * 5;
          let embed = new Discord.RichEmbed()
            .setColor(colour)
            .addField("name", object.name)
            .addField("cost", `${hardcost} (hard)\n${object.cost} (medium)`)
            .addField("notes", object.notes)
            .addField("in game description", object.description)
            .addField(`xp needed:`, `${object.xp}`)
            .addField(
              "total cost",
              `${hardTotalCost} (hard)\n${totalCost} (medium)`
            )
            .setFooter(
              "d:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration"
            );
          return message.channel.send(embed);
        }
        let object = json[`${name}`].upgrades[path - 1][tier - 1];
        let totalCost = 0;
        let newCost = 0;
        for (i = tier; i > 0; i--) {
          newCost = json[`${name}`].upgrades[path - 1][i - 1].cost;
          totalCost += parseInt(newCost);
        }

        hardcost = Math.round((object.cost * 1.08) / 5) * 5;
        hardTotalCost = Math.round((totalCost * 1.08) / 5) * 5;
        let embed = new Discord.RichEmbed()
          .setColor(colour)
          .addField("name", object.name)
          .addField("cost", `${hardcost} (hard)\n${object.cost} (medium)`)
          .addField("notes", object.notes)
          .addField("in game description", object.description)
          .addField(`xp needed:`, `${object.xp}`)
          .addField(
            "total cost",
            `${hardTotalCost} (hard)\n${totalCost} (medium)`
          )
          .setFooter(
            "d:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration"
          );
        message.channel.send(embed);
      });
  }
};
