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
			} else if (args[1].includes('me')) {
				var yeet = cost;
			} else if (args[1].includes('ha')) {
				var yeet = cost / 1.08;
			} else if (args[1].includes('im')) {
				var yeet = cost / 1.2;
			} else {
				var yeet = cost;
			}
		}
		const embed = new Discord.RichEmbed()
			.addField('easy', yeet * 0.85, true)
			.addField('normal', yeet, true)
			.addField('hard', yeet * 1.08, true)
			.addField('impoppable', yeet * 1.2, true);
		message.channel.send(embed);
	}
};
