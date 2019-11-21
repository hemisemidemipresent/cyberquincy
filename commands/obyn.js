const h=require('../heroes.json');
const Discord = require('discord.js')
module.exports = {
	name: 'obyn',
    description: 'obyn upgrades/cost',
    aliases: ['o', 'O'],
    usage: '!obyn <level>',
	execute(message, args) {
		const hh = h['obyn'][parseInt(args[0])]
		const heroEmbed = new Discord.RichEmbed()
		.setTitle('Obyn')
		.addField('cost',`${hh.cost}`)
		.addField('desc',`${hh.desc}`)
		.setFooter('use q!ap for help and elaboration')
		message.channel.send(heroEmbed)
	},
};