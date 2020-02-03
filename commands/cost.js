const Discord = require('discord.js');
module.exports = {
	name: 'cost',
	aliases: ['price', 'convert'],
	execute(message, args, client) {
		if (!args) return message.channel.send('The syntax is q!cost <money> <gamemode>');
		let yeet, cost, diff;
		if (!isNaN(args[0])) {
			cost = args[0]
		} else {
			if (args[0].includes('ea')) {
				yeet = cost / 0.85;
				diff = 'easy'
			} else if (args[0].includes('me') || args[0].includes('no')) {
				yeet = cost;
				diff = 'normal'
			} else if (args[0].includes('ha')) {
				yeet = cost / 1.08;
				diff = 'hard'
			} else if (args[0].includes('im')) {
				yeet = cost / 1.2;
				diff = 'impoppable'
			} else {
				if (!isNaN(args[1])) {
					cost = args[1]
				}
				if (args[1].includes('ea')) {
					yeet = cost / 0.85;
					diff = 'easy'
				} else if (args[1].includes('me') || args[1].includes('no')) {
					yeet = cost;
					diff = 'normal'
				} else if (args[1].includes('ha')) {
					yeet = cost / 1.08;
					diff = 'hard'
				} else if (args[1].includes('im')) {
					yeet = cost / 1.2;
					diff = 'impoppable'
				} else {
					return message.channel.send('The syntax is q!cost <money> <gamemode>');
				}
			}

		}
		let easy = Math.floor(yeet * 0.85);
		let normal = Math.floor(yeet);
		let hard = Math.floor(yeet * 1.08);
		let impoppable = Math.floor(yeet * 1.2);
		const embed = new Discord.RichEmbed()
			.setDescription(`converted ${cost} in ${diff} game mode:`)
			.addField('easy', `${easy}`, true)
			.addField('normal', `${normal}`, true)
			.addField('hard', `${hard}`, true)
			.addField('impoppable', `${impoppable}`, true);
		message.channel.send(embed);
	}
};
