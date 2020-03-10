const Discord = require("discord.js");
const { colour } = require("../shh/config.json");
const fetch = require("node-fetch");
const url = "http://topper64.co.uk/nk/btd6/dat/towers.json";
const settings = { method: "Get" };
module.exports = {
  name: "heli",
  description: "heli upgrades desc",
  aliases: ["helicopter", "helipilot"],
  usage: "<path1> <path2> <path3>",
  execute(message, args, client) {
    let name = "heli-pilot";
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
        if (path === 0 || tier == 0 || args[0] === "base") {
          let object = json[`${name}`];
          let embed = new Discord.RichEmbed()
            .setColor(colour)
            .addField("name", object.name)
            .addField("cost", object.cost)
            .addField("notes", object.notes)
            .addField("in game description", object.description)
            .addField(`xp needed:`, `${object.xp}`)
            .setFooter(
              "d:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help"
            );
          return message.channel.send(embed);
        }
        let object = json[`${name}`].upgrades[path - 1][tier - 1];
        let embed = new Discord.RichEmbed()
          .setColor(colour)
          .addField("name", object.name)
          .addField("cost", object.cost)
          .addField("notes", object.notes)
          .addField("in game description", object.description)
          .addField(`xp needed:`, `${object.xp}`)
          .setFooter(
            "d:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help"
          );
        message.channel.send(embed);
      });
  }
};
