const GoogleSpreadsheet = require("google-spreadsheet");
const { promisify } = require("util");
const creds = require("../shh/config.json");
module.exports = {
  name: "race",
  aliases: ["r", "rac", "ra", "racc", "rae"],
  cooldown: 5,
  execute(message, args, client) {
    if (isNaN(args[0]))
      return message.channel.send("please specify a valid race number");
    async function access(n) {
      if (isNaN(n)) return message.channel.send("please specify a number");
      message.channel.send(
        "This may time out, please give us a moment. If it doesnt respond, please try again"
      );
      const doc = new GoogleSpreadsheet(
        "1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA"
      );
      await promisify(doc.useServiceAccountAuth)(creds);
      await promisify(doc.useServiceAccountAuth)(creds);
      const info = await promisify(doc.getInfo)();
      console.log(`Loaded doc: ` + info.title + ` by ` + info.author.email);
      const sheet = info.worksheets[15];
      console.log(
        `sheet 1: ` + sheet.title + ` ` + sheet.rowCount + `x` + sheet.colCount
      );
      let aa = [];
      let bb = [];
      n = n * 3;
      let cells = await promisify(sheet.getCells)({
        "min-row": n + 9,
        "max-row": n + 9,
        "min-col": 3,
        "max-col": 25,
        "return-empty": true
      });
      let row2 = await promisify(sheet.getCells)({
        "min-row": n + 10,
        "max-row": n + 11,
        "min-col": 7,
        "max-col": 25,
        "return-empty": true
      });
      for (const cell of cells) {
        aa.push(`${cell.value}`);
      }
      for (const cell of row2) {
        bb.push(`${cell.value}`);
      }
      message.channel.send(
        `name: ${aa[0]}\ndate: ${aa[2]}\ninfo: ${aa[4]}, ${bb[0]}, ${bb[19]}\n1st: ${aa[12]}, ${bb[8]}, ${bb[27]}\n2nd: ${aa[14]}, ${bb[10]}, ${bb[29]}\n3rd: ${aa[16]}, ${bb[12]}, ${bb[31]}\n4th: ${aa[18]}, ${bb[14]}, ${bb[33]}\n5th: ${aa[20]}, ${bb[16]}, ${bb[35]}`
      );
    }
    access(parseInt(args[0]));
  }
};
