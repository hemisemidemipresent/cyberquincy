module.exports = {
  name: "support",
  aliases: ["email"],
  execute(message, args) {
    message.delete();
    message.channel.send("support@ninjakiwi.com");
  }
};