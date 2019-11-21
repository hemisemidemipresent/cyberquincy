const h = require('../heroes.json')
const Discord = require('discord.js')
module.exports = {
	name: 'gwen',
    description: 'gwen upgrades',
    aliases: ['g', 'G', 'gwendolyn'],
    usage: '!gwen <level>',
	execute(message, args) {
		const hh = h['gwen'][parseInt(args[0])]
		const heroEmbed = new Discord.RichEmbed()
		.setTitle('Gwen')
		.addField('cost',`${hh.cost}`)
		.addField('desc',`${hh.desc}`)
		.setFooter('use q!ap for help and elaboration')
		message.channel.send(heroEmbed)
    },
};