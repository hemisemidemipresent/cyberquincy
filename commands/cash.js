const r = require("../jsons/round2.json");
const abr = require("../jsons/abrincome.json");
module.exports = {
  name: "cash",
  aliases: ["ca", "k", "cost"],
  execute(message, args) {
    if (args[0] == "help" || !args[0]) {
      return message.channel.send(
        "q!cash <cash needed> <startround>\n(if startround = 0, starting cash is included)",
        { code: "md" }
      );
    }
    if (isNaN(args[0]) || isNaN(args[1])) {
      return message.channel.send("Please input a proper round number");
    }
    if (args[1] < 0 || args[1] > 100) {
      return message.channel.send(
        "Please use a proper range for cash needed and starting  (0<round<101)"
      );
    }

    let cashNeeded = args[0];
    let startRound = args[1];
    let cashSoFar = 0;
    let addToTotal = 0;
    while (cashSoFar <= cashNeeded) {
      addToTotal = parseInt(r[startRound].csh);
      cashSoFar += addToTotal;
      addToTotal = 0;
      startRound++;
      if (startRound > 100) {
        return message.channel.send(
          `You cant get $${cashNeeded} before freeplay`
        );
      }
    }
    message.channel.send(
      `You should get $${cashNeeded} by round ${startRound}`
    );
  }
};
