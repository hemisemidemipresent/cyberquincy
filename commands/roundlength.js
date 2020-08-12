const lengths = require('../jsons/roundlength.json')
const Discord = require('discord.js')
const { red, lightgrey, grey } = require('../jsons/colours.json')
module.exports = {
    name: 'roundlength',
    aliases: ['length', 'rl', 'l'],
    execute(message, args) {
        if (!args || isNaN(args[0])) {
            const errorEmbed = new Discord.MessageEmbed()
                .setDescription(
                    'q!roundlength <start round> <end round> (shows the longest round)'
                )
                .setColor(red)
            return message.channel.send(errorEmbed)
        } else if (!args[1]) {
            const embed = new Discord.MessageEmbed()
                .setDescription(
                    `round ${args[0]} is ${
                    lengths[parseInt(args[0]) - 1]
                    }s long`
                )
                .setColor(lightgrey)
            return message.channel.send(embed)
        } else if (args[1]) {
            const startRound = parseInt(args[0])
            const endRound = parseInt(args[1])
            let longestRound = 0
            let longestLength = 0
            for (let i = startRound; i < endRound; i++) {
                if (longestLength < lengths[i]) {
                    longestLength = lengths[i]
                    longestRound = i + 1
                }
            }
            const embed = new Discord.MessageEmbed()
                .setDescription(
                    `From round ${startRound} to ${endRound}, the longest round is round ${longestRound} which is ${
                    Math.round(longestLength * 100) / 100
                    }s long`
                )
                .setColor(grey)
            message.channel.send(embed)
        }
    }
}
