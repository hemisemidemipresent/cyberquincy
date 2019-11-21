const { prefix , colour} = require('../config.json');
const Discord = require('discord.js')
module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command.',
	aliases: ['commands','quincyhelp','qhelp','cyberquincy','chelp','qhelp','h','ch','qh','quincyh'],
	usage: '[command name]',
	cooldown: 5,
	execute(message, args) {
		const data = [];
		const { commands } = message.client;

		if (!args.length) {
			userneedhelp=message.author
      	const helpembed = new Discord.RichEmbed()
          .setColor(colour) 
          .setDescription(`Hi! I am Cyber Quincy. I am a btd6 bot made by hnngggrrrr#8734.`)
          .addField('general information:','[List of commands](https://docs.google.com/document/d/1NJqQ82EUP6yTri1MV63Pbk-l_Lo_WKXCndH7ED8retY/edit?usp=sharing)\n[support server](https://discord.gg/8agRm6c)')
          .addField('Please note that this bot\'s name and avatar are owned by ninja Kiwi. This bot has no association with them.',' (yet);P')
          .setFooter('have a popping day')
			userneedhelp.send(helpembed)
				.then(() => {
					if (message.channel.type === 'dm') return;
					message.reply('I\'ve sent you a DM!');
				})
				.catch(error => {
					console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
					message.reply('it seems like I can\'t DM you!');
				});
		}

		if (args[0]!==undefined){
			const name = args[0].toLowerCase()
			const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
			if (!command) {
				return message.reply('that\'s not a valid command / that\'s not a command!');
			}
	
			data.push(`**Name:** ${command.name}`);
	
			if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
			if (command.description) data.push(`**Description:** ${command.description}`);
			if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
	
			data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);
	
			message.channel.send(data, { split: true });
		}if (args===undefined){
			return;
		}	
	},
}