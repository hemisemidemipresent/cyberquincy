const xp = require('../xp.json')
const Discord = require('discord.js')
const {colour, prefix} = require('../config.json')
module.exports ={
    name: 'level',
    execute(message,args){
        if(args[0]!=undefined){
			if(args[0].includes('reward')){
			const lvlMebed = new Discord.RichEmbed()
            	.setTitle(`xp rewards`)
            	.addField('level 3',`<@&645126928340353036> `)
            	.addField('level 10',`<@&645629187322806272>`)
            	.setColor(colour)
				.addField('you only get role rewards in the bot support server','[support server](https://discord.gg/8agRm6)')
            	.setFooter(`you only get role rewards in the bot support server`)
			return message.channel.send(lvlMebed)
			}else{
				let curxp = xp[args[0]].xp
        		let curlvl = xp[args[0]].level
        		let nextlvl = (curlvl+1)*300;
        		let difference = Math.abs(curxp-nextlvl)
				const lvlMebed = new Discord.RichEmbed()
            		.setTitle(`${args[0]}'s xp:`)
            		.addField('level',`${curlvl}`)
            		.addField('xp',`${curxp}`)
            		.setColor(colour)
            		.addField(`xp to level up`,`${difference} more `)
					.setFooter(`You get xp everytime you use a command!. use ${prefix}level rewards to see role rewards!`)
				return message.channel.send(lvlMebed)
			}
		}
		if(!xp[message.author.id]){
            xp[message.author.id]={
                xp:0,
                level: 1
            }
        }
        let curxp = xp[message.author.id].xp
        let curlvl = xp[message.author.id].level
        let nextlvl = (curlvl+1)*300;
        let difference = Math.abs(curxp-nextlvl)
        let guildmember = message.member
        const lvlMebed = new Discord.RichEmbed()
            .setTitle(`${guildmember.displayName}'s xp:`)
            .addField('level',`${curlvl}`)
            .addField('xp',`${curxp}`)
            .setColor(colour)
            .addField(`xp to level up`,`${difference} more `)
			.setFooter(`use ${prefix}level rewards to see role rewards!`)
        message.channel.send(lvlMebed)
    }
}