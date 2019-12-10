const h = require('../heroes.json');
const Discord = require('discord.js');
module.exports = {
	name: 'pat',
    description: 'pat upgrades',
    aliases: ['p', 'pf', 'fusty', 'patfusty'],
    usage: '!pat <level>',
	execute(message, args) {
		const hh = h['pat'][parseInt(args[0])];
		const heroEmbed = new Discord.RichEmbed()
		.setTitle('Pat Fusty')
		.addField('cost',`${hh.cost}`)
		.addField('desc',`${hh.desc}`)
		.setFooter('use q!ap for help and elaboration');
		message.channel.send(heroEmbed)
    },
};