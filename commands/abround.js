const r = require("../jsons/rounds.json");
module.exports = {
  name: "abround",
  description:
    "tells you about the abr rounds (below 100 cos freeplay abr is the same as normal)",
  aliases: ["abr"],
  usage: "!abround <round>",
  execute(message, args) {
    if (parseInt(args[0]) < 1) {
      return message.channel.send("Quincy has no experience in these rounds");
    } else if (parseInt(args[0]) > 100) {
      return message.channel.send(
        "HEY! All rounds from 100 above are all random!"
      );
    }
    const index = parseInt(args[0]);
    var data = r[`ar${index}`];
    message.channel.send(`${data}`);
  }
};
