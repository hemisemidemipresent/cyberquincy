const Discord = require('discord.js');
module.exports = {
    name: 'amitheowner',
    aliases: ['amithedev', 'ami', 'verify'],
    execute(message, args, client) {
        if (message.author.id !== '699780654740668426') {
            return message.channel.send('You are not the owner');
        } else {
            return message.channel.send(`Hi, ${message.author.username}`);
        }
    },
};
