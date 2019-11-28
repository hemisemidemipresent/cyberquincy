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
	},
}