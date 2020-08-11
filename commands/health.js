const Discord = require('discord.js')
module.exports = {
    name: 'health',
    aliases: ['h', 'hp'],
    description: 'calculates the health of blimps, even in freeplay',
    usage: '!health <bloon> <round>',
    execute(message, args) {
        // <WARNING!!!>
        // THIS CODE IS A MESS
        let b, round
        if (
            !isNaN(args[0]) ||
            !args[0]
        ) {
            return message.channel.send(
                'please specify a proper round/blimp/bloon type'
            )
        } else if (isNaN(args[0])) {
            b = args[0].toUpperCase()
            round = args[1]
        } else if (isNaN(args[1])) {
            b = args[1].toUpperCase()
            round = args[0]
        }
        var round1 = round - 80
        var round2 = round - 100
        var round3 = round - 125
        var round4 = round - 152
        let bloon
        if (b.includes('MOAB')) {
            bloon = 200
        } else if (b.includes('BFB')) {
            bloon = 700
        } else if (b.includes('ZOMG')) {
            bloon = 4000
        } else if (b.includes('DDT')) {
            bloon = 400
        } else if (b.includes('BAD')) {
            bloon = 20000
        } else {
            return message.channel.send('please specify a blimp, e.g. q!health ZOMG')
        }
        // multiplier
        var m1 = 0.02 * round1
        var m2 = 0.05 * round2
        var m3 = 0.2 * round3
        var m4 = 0.5 * round4
        // percentage increase
        let percentageInc
        if (round > 80 && round < 101) {
            percentageInc = 1 + m1 // 80 to 100
        } else if (round > 100 && round < 125) {
            // 100 to 125
            percentageInc = 1 + m2 + 0.4
        } else if (round > 124 && round < 152) {
            // 125 to 152
            percentageInc = 1 + m3 + 0.4 + 1.25
        } else if (round > 151) {
            percentageInc = 1 + m4 + 0.4 + 1.25 + 5.4
        }
        const bhealth = Math.floor(bloon * percentageInc)

        if (round > 80 && isValidBlimp(b)) {
            return message.channel.send(
                `${bhealth} pops are needed to pop this blimp (not including children)`
            )
        } else if (round < 1) {
            return message.channel.send(
                'quincy has no experience in these rounds'
            )
        } else if (round > 0 && round < 81) {
            return message.channel.send(`${bloon}`)
        } else {
            if (isValidBlimp) {
                return message.channel.send(bloon)
            } else {
                const errorEmbed = new Discord.MessageEmbed()
                    .setColor('#ff0000')
                    .setDescription('Oh no! Something went wrong!')
                    .addField(
                        '~~I got bonked by a DDT again~~',
                        'Please [report the bug](https://discord.gg/VMX5hZA)'
                    )
                message.reply(errorEmbed)
            }
        }
    }
}
function isValidBlimp(b) {
    if (b.includes('MOAB') || b.includes('BFB') || b.includes('ZOMG') || b.includes('DDT') || b.includes('BAD')) {
        return true
    }
    return false
}
