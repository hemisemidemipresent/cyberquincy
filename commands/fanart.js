const art = require("../jsons/pic.json");
module.exports = {
  name: "fanart",
  aliases: ["fan", "pic", "art", "fa"],
  execute(message, args) {
    if (args[0]) {
      if (args[0] < 1 || args[0] > art.length || isNaN(args[0])) {
        return message.channel.send(
          `Please use a proper number from 1 to ${art.length}`
        );
      } else {
        return message.channel.send(art[args[0] - 1]);
      }
    }
    let ranNum = Math.floor(Math.random() * art.length);
    message.channel.send(art[ranNum]);
  }
};
