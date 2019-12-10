const h = require('../heroes.json');
const Discord = require('discord.js');
module.exports = {
	name: 'benjamin',
    description: 'benjamin upgrades',
    aliases: ['b', 'dj', 'ben', 'B'],
    usage: '!benjamin <level>',
	execute(message, args) {
		if(!args){
			return message.channel.send(`Please specify a level \`\`e.g.: ${message.content} 4\`\``)
		}
		const hh = h['ben'][parseInt(args[0])];
		const heroEmbed = new Discord.RichEmbed()
		.setTitle('Benjamin')
		.addField('cost',`${hh.cost}`)
		.addField('desc',`${hh.desc}`)
		.setFooter('use q!ap for help and elaboration');
		message.channel.send(heroEmbed)
    },
};