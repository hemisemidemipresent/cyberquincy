const r = require("../round2.json");
const abr = require("../abrincome.json");
module.exports = {
  name: "income",
  execute(message, args) {
    if (args[0] == undefined) {
      return message.channel.send("use ``q!income help``");
    }
    if (args[0] == "help") {
      return message.channel.send(
        "1. q!income <startround> <endround>\n(if startround = 0, that means starting cash is included)\n2. q!income <difficulty> <endround>\n(includes starting cash; deflation, half cash, abr not yet, apop is random)",
        { code: "md" }
      );
    }
    if (!args[1]) {
      let endround = parseInt(args[0]);
      if (endround < 0 || endround > 100) {
        return message.channel.send("please specify a round from 1 to 100");
      }
      let end = r[endround];
      let income = end.cch;
      return message.channel.send(
        `${income} total cash from round 1 to round ${endround} (including starting cash and all the bloons popped on round ${endround})`
      );
    }
    if (isNaN(args[1])) {
      return message.channel.send(
        "please specify a number for a round from 1 to 100"
      );
    }
    let endround = parseInt(args[1]);
    if (endround < 0 || endround > 100) {
      return message.channel.send(
        "please specify a round from 1 to 100. ``!income`` ``help`` for help"
      );
    }
    if (args[0] == "easy") {
      var startround = 0;
    } else if (args[0] == "medium") {
      var startround = 3;
    } else if (args[0] == "hard") {
      var startround = 3;
    } else if (args[0].includes("imp") || args[0].includes("ch")) {
      var startround = 6;
    } else if (args[0].includes("def")) {
      return message.channel.send("$20000 start cash. You dont earn any");
    } else if (args[0].includes("alt") || args[0].includes("abr")) {
      if (!args[2]) {
        var start = 3;
        var end = args[1];
      } else var start = args[1];
      let s_arr = abr[start];
      let e_arr = abr[end];
      let diff = e_arr[1] - s_arr[1];
      if (!args[2]) {
        return message.channel.send(
          `${diff +
            650} was made from popping bloons in round 3 to popping bloons in round ${end} (including starting cash)`
        );
      } else {
        return message.channel.send(
          `${diff} was made from popping bloons in round ${start} to popping bloons in round ${end} (not including starting cash)`
        );
      }
    } else {
      var startround = parseInt(args[0]);
      if (startround < 0 || startround > 100) {
        return message.channel.send(
          "please specify a round from 1 to 100. ``!income`` ``help`` for help"
        );
      }
    }
    let start = r[startround];
    let end = r[endround];
    let income = end.cch - start.cch;
    var startround = startround + 1;
    message.channel.send(
      `earns $${income} from popping bloons in round ${startround} to popping bloons in ${endround} (not including starting cash)`
    );
  }
};
