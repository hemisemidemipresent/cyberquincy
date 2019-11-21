const h = require('../heroes.json')
const Discord = require('discord.js')
module.exports = {
	name: 'churchill',
    description: 'churchill upgrades',
    aliases: ['c', 'ch', 'CHURCHILL', 'C'],
    usage: '!churchill <level>',
	execute(message, args) {
		const hh = h['churchill'][parseInt(args[0])]
		const heroEmbed = new Discord.RichEmbed()
		.setTitle('Captain Churchill')
		.addField('cost',`${hh.cost}`)
		.addField('desc',`${hh.desc}`)
		.setFooter('use q!ap for help and elaboration')
		message.channel.send(heroEmbed)
    },
};