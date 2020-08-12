const Discord = require('discord.js')
const { cyber } = require('../jsons/colours.json')
const fetch = require('node-fetch')
const url = 'http://topper64.co.uk/nk/btd6/dat/towers.json'
const settings = { method: 'Get' }
module.exports = {
    name: 'mortar',
    description: 'mortar upgrades desc',
    aliases: ['mor', 'mortar-monkey'],
    usage: '<path1> <path2> <path3>',
    execute(message, args) {
        const name = 'mortar-monkey'

        function provideHelpMsg() {
            fetch(url, settings)
                .then((res) => res.json())
                .then((json) => {
                    let str = `Please use the number in \`\`codeblocks\`\` to specify the upgrade.\nFor example, **q!${name} 030**`
                    const pathsArr = [
                        '100',
                        '200',
                        '300',
                        '400',
                        '500',
                        '010',
                        '020',
                        '030',
                        '040',
                        '050',
                        '001',
                        '002',
                        '003',
                        '004',
                        '005'
                    ]
                    for (let i = 0; i < 15; i++) {
                        let path
                        let tier = 0
                        if (parseInt(pathsArr[i]) % 100 == 0) {
                            path = 1
                            tier = parseInt(pathsArr[i]) / 100
                        } else if (parseInt(pathsArr[i]) % 10 == 0) {
                            path = 2
                            tier = parseInt(pathsArr[i]) / 10
                        } else {
                            path = 3
                            tier = parseInt(pathsArr[i])
                        }
                        const object =
                            json[`${name}`].upgrades[path - 1][tier - 1]
                        if (i % 5 == 0) {
                            str += '\n'
                        } else {
                            str += ',   '
                        }
                        str += `__${object.name}__   \`\`${pathsArr[i]}\`\``
                    }

                    return message.channel.send(str)
                })
        }
        if (!args || args[1] || isNaN(args[0]) || args[0].includes('-')) {
            return provideHelpMsg()
        }

        const path1 = Math.floor(parseInt(args[0]) / 100)
        const path2 = Math.floor((parseInt(args[0]) - path1 * 100) / 10)
        const path3 = parseInt(args[0] - path1 * 100 - path2 * 10)
        let path = 1
        function hard(cost) {
            return Math.round((cost * 1.08) / 5) * 5
        }
        if (path2 < 1 && path3 < 1) {
            path = 1
        } else if (path1 < 1 && path3 < 1) {
            path = 2
        } else if (path1 < 1 && path2 < 1) {
            path = 3
        } else {
            return provideHelpMsg()
        }
        let tier = 0
        switch (path) {
            case 1:
                tier = path1
                break
            case 2:
                tier = path2
                break
            case 3:
                tier = path3
                break
        }
        fetch(url, settings)
            .then((res) => res.json())
            .then((json) => {
                let object = json[`${name}`].upgrades[path - 1][tier - 1]
                if (!object) {
                    object = json[`${name}`]
                    const embed = new Discord.MessageEmbed()
                        .setColor(cyber)
                        .addField('name', object.name)
                        .addField(
                            'cost',
                            `${object.cost} (medium), ${hard(
                                parseInt(object.cost)
                            )} (hard)`
                        )
                        .addField('notes', object.notes)
                        .addField('in game description', object.description)
                        .setFooter(
                            'd:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration'
                        )
                    return message.channel.send(embed).then((msg) => {
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

                        collector.on('collect', () => {
                            msg.delete()
                        })
                    })
                } else {
                    let totalCost = 0
                    let newCost = 0
                    for (let i = tier; i > 0; i--) {
                        newCost =
                            json[`${name}`].upgrades[path - 1][i - 1].cost
                        totalCost += parseInt(newCost)
                    }
                    const baseCost = parseInt(json[`${name}`].cost)
                    totalCost += baseCost

                    const embed = new Discord.MessageEmbed()
                        .setColor(cyber)
                        .addField('name', object.name)
                        .addField(
                            'cost',
                            `${hard(parseInt(object.cost))} (hard), ${object.cost} (medium)`

                        )
                        .addField('notes', object.notes)
                        .addField('in game description', object.description)
                        .addField('xp needed:', `${object.xp}`)
                        .addField(
                            'total cost',
                            `${hard(totalCost)} (hard), ${totalCost} (medium)`
                        )
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

                        collector.on('collect', () => {
                            msg.delete()
                        })
                    })
                }
            })
    }
}
