const t = require('../tier.json');
const { colour } = require('../config.json');
const Discord = require('discord.js');
module.exports = {
	name: 'tier',
	description: 'shows tier list',
	aliases: [ 'tl' ],
	usage: 'q!tier <version>',
	execute(message, args, client) {
		if (!args) {
			return message.channel.send(`${t.t[3]}`);
		}
		let v = parseInt(args[0]) - 11;
		if (!v) {
			return message.channel.send('Please specify a proper version! not every version has a tier list!');
		}
		return message.channel.send(`${t.t[v]}`);
	}
};
