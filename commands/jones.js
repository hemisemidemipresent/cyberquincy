const h = require('../heroes.json')
const Discord = require('discord.js')
module.exports = {
	name: 'jones',
    description: 'jones upgrades',
    aliases: ['SJ', 'sj', 'striker'],
    usage: '!jones <level>',
	execute(message, args) {
		const hh = h['jones'][parseInt(args[0])]
		const heroEmbed = new Discord.RichEmbed()
		.setTitle('Striker Jones')
		.addField('cost',`${hh.cost}`)
		.addField('desc',`${hh.desc}`)
		.setFooter('use q!ap for help and elaboration')
		message.channel.send(heroEmbed)
    },
};