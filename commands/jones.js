const h = require('../heroes.json');
const { colour } = require('../config.json');
const Discord = require('discord.js');
module.exports = {
	name: 'jones',
	description: 'jones upgrades',
	aliases: ['SJ', 'sj', 'striker', 'bones', 'biker', 'who'],
	usage: '!jones <level>',
	execute(message, args, client) {
		if (!args) {
			return message.channel.send(`Please specify a level \`\`e.g.: ${message.content} 4\`\``)
		}
		const hh = h['jones'][parseInt(args[0])];
		if (!hh) return message.channel.send('Please specify a valid hero level!');
		const heroEmbed = new Discord.RichEmbed()
			.setTitle('Striker Jones')
			.addField('cost', `${hh.cost}`)
			.addField('desc', `${hh.desc}`)
			.setFooter('use q!ap for help and elaboration')
			.setColor(colour);
		message.channel.send(heroEmbed);
	}
};
