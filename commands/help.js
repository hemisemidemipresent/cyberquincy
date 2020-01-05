const { prefix, colour } = require('../config.json');
const Discord = require('discord.js');
module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command.',
	aliases: [ 'commands', 'quincyhelp', 'qhelp', 'cyberquincy', 'chelp', 'qhelp', 'h', 'ch', 'qh', 'quincyh' ],
	usage: '[command name]',
	cooldown: 5,
	execute(message, args, client) {
		message.channel.send('The help page has moved to https://hnngggrrrr.github.io/cq/!')
	}
};
