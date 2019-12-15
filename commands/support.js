module.exports = {
  name: "support",
  aliases: ["email"],
  execute(message, args, client) {
    message.delete();
    message.channel.send("support@ninjakiwi.com");
  }
};
