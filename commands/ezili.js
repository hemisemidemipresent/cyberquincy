const h = require('../heroes.json')
const Discord = require('discord.js')
module.exports = {
	name: 'ezili',
    description: 'ezili upgrades',
    aliases: ['e', 'ez', 'EZILI', 'E'],
    usage: '!ezili <level>',
	execute(message, args) {
		const hh = h['ezili'][parseInt(args[0])]
		const heroEmbed = new Discord.RichEmbed()
		.setTitle('Ezili')
		.addField('cost',`${hh.cost}`)
		.addField('desc',`${hh.desc}`)
		.setFooter('use q!ap for help and elaboration')
		message.channel.send(heroEmbed)
    },
};