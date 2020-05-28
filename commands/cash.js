const r = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json'); // array containing arrays, nth index is nth round, in the returned array 0th value is new cash, 1st value is total cash
const Discord = require('discord.js');
const { colour } = require('../shh/config.json');
module.exports = {
    name: 'cash',
    aliases: ['ca', 'k', 'cost'],
    execute(message, args) {
        if (isNaN(args[0]) || !args[0] || isNaN(args[1]) || !args[1]) {
            return message.channel.send(
                'q!cash <cash needed> <startround>\n(if startround = 0, starting cash is included)',
                { code: 'md' }
            );
        }
        let cashNeeded = args[0];
        let startRound = args[1];
        let cashSoFar = 0;
        let addToTotal = 0;
        if (!args[2]) {
            while (cashSoFar <= cashNeeded) {
                addToTotal = parseInt(r[startRound].csh);
                cashSoFar += addToTotal;
                addToTotal = 0;
                startRound++;
                if (startRound > 100) {
                    let embed = new Discord.MessageEmbed()
                        .setTitle(`You cant get $${cashNeeded} before freeplay`)
                        .setColor('#ff5500');
                    return message.channel.send(embed);
                }
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `You should get $${cashNeeded} by round ${startRound}`
                )
                .setColor(colour)
                .setFooter(`from round ${args[1]}`);
            return message.channel.send(embed);
        }
        if (args[2].includes('alt') || args[2].includes('abr')) {
            while (cashSoFar <= cashNeeded) {
                addToTotal = parseInt(abr[startRound][0]);
                cashSoFar += addToTotal;
                addToTotal = 0;
                startRound++;
                if (startRound > 100) {
                    let embed = new Discord.MessageEmbed()
                        .setTitle(`You cant get $${cashNeeded} before freeplay`)
                        .setColor('#ff5500');
                    return message.channel.send(embed);
                }
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `You should get $${cashNeeded} by round ${startRound}`
                )
                .setColor(colour)
                .setFooter(`in ABR, from round ${args[1]}`);
            return message.channel.send(embed);
        }
    },
};
