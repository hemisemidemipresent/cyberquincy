const { prefix , colour} = require('../config.json');
const Discord = require('discord.js')
module.exports = {
	name: 'vtsg',
	description: 'List all of my commands or info about a specific command.',
	aliases: ['vengeful','dark'],
	usage: '[command name]',
	cooldown: 5,
	execute(message, args) {
        const vtsgembed = new Discord.RichEmbed()
        .setImage('https://cdn.discordapp.com/attachments/454395715834216459/645780538803879936/PicsArt_11-17-10.37.53.jpg')
        message.channel.send(vtsgembed)
	}
}