const Discord = require('discord.js');
module.exports = {
	name: 'cost',
	aliases: [],
	execute(message, args, client) {
		if (isNaN(args[0])) return message.channel.send('Please specify a number!');
		let cost = parseInt(args[0]);
		if (args[1]) {
			if (args[1].includes('ea')) {
				var yeet = cost / 0.85;
			} else if (args[1].includes('me') || args[1].includes('no')) {
				var yeet = cost;
			} else if (args[1].includes('ha')) {
				var yeet = cost / 1.08;
			} else if (args[1].includes('im')) {
				var yeet = cost / 1.2;
			} else {
				var yeet = cost;
			}
		}
		let easy = Math.floor(yeet * 0.85);
		let normal = Math.floor(yeet);
		let hard = Math.floor(yeet * 1.08);
		let impoppable = Math.floor(yeet * 1.2);
		const embed = new Discord.RichEmbed()
			.addField('easy', `${easy}`, true)
			.addField('normal', `${normal}`, true)
			.addField('hard', `${hard}`, true)
			.addField('impoppable', `${impoppable}`, true);
		message.channel.send(embed);
	}
};
