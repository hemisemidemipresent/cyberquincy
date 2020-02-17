const Discord = require("discord.js");
const t = require("../towers.json");
let to = [
  "dart",
  "boomer",
  "tack",
  "glue",
  "ice",
  "bomb",
  "sniper",
  "heli",
  "ace",
  "sub",
  "boat",
  "mortar",
  "ninja",
  "super",
  "wizard",
  "alch",
  "druid",
  "engi",
  "farm",
  "spac",
  "village"
];
module.exports = {
  name: "cost",
  aliases: ["price", "convert"],
  execute(message, args, client) {
    const filter = msg => msg.author.id === `${message.author.id}`;
    let fembed = new Discord.RichEmbed().setDescription(
      "please type the tower **number** you want to find the cost of:"
    );
    for (i = 0; i < to.length; i++) {
      fembed.addField(i, to[i], true);
    }
    message.channel.send(fembed);
    message.channel
      .awaitMessages(filter, { maxMatches: 1, time: 10000, errors: ["time"] })
      .then(tt => {
        let tu = tt.first().content;
        let tower = to[tu];
        if (isNaN(tu) || tu < 0 || tu > 20)
          return message.channel.send("invalid input");
        message.channel.send("please specify the path; e.g. 003");
        message.channel
          .awaitMessages(filter, {
            maxMatches: 1,
            time: 10000,
            errors: ["time"]
          })
          .then(p => {
            let pr = p.first().content;
            let path1 = Math.floor(parseInt(pr) / 100);
            let path2 = Math.floor((parseInt(pr) - path1 * 100) / 10);
            let path3 = parseInt(pr) - path1 * 100 - path2 * 10;
            if (
              path1 > 5 ||
              path1 < 0 ||
              path2 > 5 ||
              path2 < 0 ||
              path3 > 5 ||
              path3 < 0
            ) {
              return message.channel.send("please specify a proper path.");
            }
            let costs = [];
            if (path1 !== 0) {
              let e = 0;
              for (j = 1; j < path1 + 1; j++) {
                e += parseInt(t[tower][`s${1}${j}`]["cost"]);
              }
              costs.push(e);
            } else costs.push("0");
            if (path2 !== 0) {
              let e = 0;
              for (j = 1; j < path2 + 1; j++) {
                e += parseInt(t[tower][`s${2}${j}`]["cost"]);
              }
              costs.push(e);
            } else costs.push("0");
            if (path3 !== 0) {
              let e = 0;
              for (j = 1; j < path3 + 1; j++) {
                e += parseInt(t[tower][`s${3}${j}`]["cost"]);
                console.log(`${e}, ${parseInt(t[tower][`s${3}${j}`]["cost"])}`);
              }
              costs.push(e);
            } else costs.push("0");
            message.channel.send(
              `The total cost is (including base tower cost) is ${parseInt(
                costs[0]
              ) +
                parseInt(costs[1]) +
                parseInt(costs[2]) +
                parseInt(t[tower].base.cost)} (on medium)`
            );
          });
      });
  }
};
