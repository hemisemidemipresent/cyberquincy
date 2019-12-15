module.exports = {
  name:"boi",
  execute(message, args, client) {
    message.channel.send(`Serving ${client.guilds.size} servers`);
    message.channel.send(client.guilds.map(g=>g.name).join('\n'))
  },
};