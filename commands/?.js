const Discord = require('discord.js')
module.exports = {
    name: '?',
    description:'tells you about abbreviations',
    aliases:['whatis'],
    execute(message,args){
        const embed = new Discord.RichEmbed()
		.setImage('https://cdn.discordapp.com/attachments/647727203982770176/647783656521203724/Screenshot_86.png')
		message.channel.send(embed)
    }
}