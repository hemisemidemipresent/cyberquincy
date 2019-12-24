const h = require('../heroes.json'); const {colour} = require('../config.json')
const Discord = require('discord.js');
module.exports = {
	name: 'churchill',
    description: 'churchill upgrades',
    aliases: ['c', 'ch', 'CHURCHILL', 'C'],
    usage: '!churchill <level>',
	execute(message, args, client) {
		if(!args){
			return message.channel.send(`Please specify a level \`\`e.g.: ${message.content} 4\`\``)
		}
		const hh = h['churchill'][parseInt(args[0])];
		if(!hh)return message.channel.send('Please specify a valid hero level!');
		const heroEmbed = new Discord.RichEmbed()
		.setTitle('Captain Churchill')
		.addField('cost',`${hh.cost}`)
		.addField('desc',`${hh.desc}`)
		.setFooter('use q!ap for help and elaboration').setColor(colour)
		message.channel.send(heroEmbed)
    },
};