const Discord = require('discord.js')
const { cyber, red } = require('../jsons/colours.json')
const fetch = require('node-fetch')
const url = 'http://topper64.co.uk/nk/btd6/dat/towers.json'
const settings = { method: 'Get' }
module.exports = {
    name: 'obyn',
    description: 'obyn upgrades/cost',
    aliases: ['o', 'O', 'ocyn'],
    usage: '!obyn <level>',
    execute (message, args) {
        if (!args) {
            const errorEmbed = new Discord.MessageEmbed()
                .setColor(red)
                .setDescription(
                    `Please specify a level for the hero\ne.g. ${message.content} 20`
                )
            return message.channel.send(errorEmbed)
        }
        const name = 'obyn-greenfoot'
        const level = parseInt(args[0])
        fetch(url, settings)
            .then((res) => res.json())
            .then((json) => {
                const object = json[`${name}`].upgrades[level - 1]

                if (!object) {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setColor(red)
                        .setDescription(
                            `Please specify a level for the hero\ne.g. q!${name} 20`
                        )
                    return message.channel.send(errorEmbed)
                }
                const embed = new Discord.MessageEmbed()
                    .setTitle(`${name} level ${level}`)
                    .addField("cost/'xp'", `${object.xp}`)
                    .addField('desc', `${object.notes}`)
                    .setColor(cyber)
                    .setFooter(
                        'd:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration'
                    )
                message.channel.send(embed).then((msg) => {
                    msg.react('❌')
                    const filter = (reaction, user) => {
                        return (
                            reaction.emoji.name === '❌' &&
                            user.id === message.author.id
                        )
                    }
                    const collector = msg.createReactionCollector(filter, {
                        time: 20000
                    })

                    collector.on('collect', (reaction, reactionCollector) => {
                        msg.delete()
                    })
                })
            })
    }
}
