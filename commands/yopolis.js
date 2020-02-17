const Discord = require("discord.js");
const { colour } = require("../config.json");
module.exports = {
  name: "monkeyopolis",
  aliases: ["mp"],
  execute(message, args) {
    if (!args.length) {
      return message.channel.send(
        "# The usage is:\nq!mp <total farm cost> <total farm amount>",
        { code: "md" }
      );
    }
    if (isNaN(args[0]) == true) {
      return message.channel.send(
        "Please Specify a **number** for the cost of the farm"
      );
    }
    if (args[1] === undefined || isNaN(args[1]) == true) {
      var farmcount = 1;
    } else {
      var farmcount = args[1];
    }
    let money = 300 * Math.floor(args[0] / 2000);
    let price = farmcount * 5000;
    let profit = money - price;
    let even = Math.ceil(price / money);
    const mpembed = new Discord.RichEmbed()
      .setTitle("Monkeyopolis Simulator")
      .setColor(colour)
      .addField("amount sacrificed", `${args[0]}`)
      .addField("farms sacrificed", `${farmcount}`)
      .addField("Money produced in a round", `${money}`, true)
      .addField("cost of upgrade", `${price}`, true)
      .addField("rounds until breaking even", `${even}`, true);
    message.channel.send(mpembed);
  }
};
