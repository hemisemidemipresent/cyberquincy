const { prefix, colour } = require('../config.json');
const Discord = require('discord.js');
module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command.',
	aliases: [ 'commands', 'quincyhelp', 'qhelp', 'cyberquincy', 'chelp', 'qhelp', 'h', 'ch', 'qh', 'quincyh' ],
	usage: '[command name]',
	cooldown: 5,
	execute(message, args, client) {
		const data = [];
		const { commands } = message.client;

		if (!args.length) {
			let userneedhelp = message.author;
			const helpembed = new Discord.RichEmbed()
				.setColor(colour)
				.setTitle('Cyber Quincy Command List')
				.setDescription(`[support server](https://discord.gg/8agRm6c)`)
				.addField('Hero Commands', '``q!help hero``', true)
				.addField('Round Commands', '``q!help round``', true)
				.addField('Freeplay Commands', '``q!help free``', true)
				.addField('Advanced Popology', '``q!help ap``', true)
				.addField('Miscellanious BTD', '``q!help misc``', true)
				.addField('Other Commands', '``q!help other``', true)
				.setFooter(
					"Please note that this bot's name and avatar are owned by ninja Kiwi. This bot has no association with them. and probably wont"
				);
			userneedhelp
				.send(helpembed)
				.then(() => {
					if (message.channel.type === 'dm') return;
					message.reply("I've sent you a DM!");
				})
				.catch((error) => {
					console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
					message.reply("it seems like I can't DM you!");
				});
		}
		if (!args[0]) return;
		if (args[0].includes('hero')) {
			const heroembed = new Discord.RichEmbed()
				.setColor(colour)
				.setTitle('**Hero Commands**')
				.setDescription('q!pat, q!benjamin, q!gwen, q!ezili, q!quincy, q!obyn, q!striker, q!churchill');
			message.channel.send(heroembed);
		} else if (args[0].includes('round')) {
			const rembed = new Discord.RichEmbed()
				.setColor(colour)
				.setTitle('**Round Commands**')
				.setDescription('q!round, q!abround');
			message.channel.send(rembed);
		} else if (args[0].includes('free')) {
			const fembed = new Discord.RichEmbed()
				.setColor(colour)
				.setTitle('**Freeplay Commands**')
				.setDescription('q!speed, q!health');
			message.channel.send(fembed);
		} else if (args[0].includes('ap')) {
			const apembed = new Discord.RichEmbed()
				.setColor(colour)
				.setTitle('**Advanced Popology Commands**')
				.setDescription(
					'q!ap, q!dart, q!boomerang, q!bomb, q!ice, q!glue, q!sniper, q!heli, q!sub, q!boat, q!ace, q!mortar, q!wizard, q!ninja, q!super, q!alchemist, q!druid, q!spactory, q!farm, q!engineer, q!village'
				);
			message.channel.send(apembed);
		} else if (args[0].includes('misc')) {
			const membed = new Discord.RichEmbed()
				.setColor(colour)
				.setTitle('**BTD miscellanious Commands**')
				.setDescription('q!monkeyopolis, q!quiz, q!fact, q!map, q!pic');
			message.channel.send(membed);
		} else if (args[0].includes('other')) {
			const oembed = new Discord.RichEmbed()
				.setColor(colour)
				.setTitle('**Other Commands**')
				.setDescription('q!help, q!credits, q!server, q!info, q!ping');
			message.channel.send(oembed);
		}
	}
};
