const GoogleSpreadsheet = require("google-spreadsheet");
const { promisify } = require("util");
const creds = require("../shh/secret.json");
module.exports = {
  name: "3tcabr",
  aliases: ["3tabr", "3tcab", "3cabr", "3tcar", "abrc"],
  cooldown: 5,
  execute(message, args, client) {
    async function access(n) {
      message.channel
        .send("This may take up to 20 seconds, please give us a moment")
        .then(msg => {
          msg.delete(5000);
        })
        .catch(/*Your Error handling if the Message isn't returned, sent, etc.*/);
      const doc = new GoogleSpreadsheet(
        "1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA"
      );
      await promisify(doc.useServiceAccountAuth)(creds);
      await promisify(doc.useServiceAccountAuth)(creds);
      const info = await promisify(doc.getInfo)();
      console.log(`Loaded doc: ` + info.title + ` by ` + info.author.email);
      const sheet = info.worksheets[2];
      console.log(
        `sheet 1: ` + sheet.title + ` ` + sheet.rowCount + `x` + sheet.colCount
      );
      let aa = [];
      let cells = await promisify(sheet.getCells)({
        "min-row": n + 11,
        "max-row": n + 11,
        "min-col": 3,
        "max-col": 15,
        "return-empty": true
      });
      for (const cell of cells) {
        aa.push(`${cell.value}`);
      }
      message.channel.send(
        `First tower: ${aa[0]}\nSecond tower: ${aa[2]}\nThird tower: ${aa[4]}\nUpgrades: ${aa[6]}\nMap: ${aa[8]}\nversion: ${aa[10]}\ndate: ${aa[11]}\nPerson: ${aa[12]}`
      );
    }
    if (isNaN(args[0]))
      return message.channel.send(
        "Please specify a proper 3 towers chimps alternate bloon rounds combo **number**"
      );
    access(parseInt(args[0]));
  }
};
