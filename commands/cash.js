const r = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json'); // array containing arrays, nth index is nth round, in the returned array 0th value is new cash, 1st value is total cash
const Discord = require('discord.js');
const { cyber, orange } = require('../jsons/colours.json');
module.exports = {
    name: 'cash',
    aliases: ['ca', 'k', 'cost'],
    execute(message, args) {
        if (isNaN(args[0]) || isNaN(args[1]) || !args[1]) {
            return message.channel.send(
                '**q!cash <cashNeeded> <startRound>**\nShows which round you will afford ``cashNeeded`` from popping bloons starting from round ``startRound``\nfor example q!cash 66000 63'
            );
        }
        let cashNeeded = args[0];
        let startRound = args[1];
        let cashSoFar = 0;
        let addToTotal = 0;
        if (startRound > 100 || startRound < 1) {
            return message.channel.send(
                'Please enter a proper round number from 1 - 100.'
            );
        } else if (!args[2]) {
            while (cashSoFar <= cashNeeded) {
                addToTotal = parseInt(r[startRound].csh);
                cashSoFar += addToTotal;
                addToTotal = 0;
                startRound++;
                if (startRound > 100) {
                    let embed = new Discord.MessageEmbed()
                        .setTitle(
                            `You cant get $${cashNeeded} from popping bloons from round ${startRound} before freeplay`
                        )
                        .setFooter('freeplay is random, hence cash is random')
                        .setColor(orange);
                    return message.channel.send(embed);
                }
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `You should get $${cashNeeded} by round ${startRound}`
                )
                .setColor(cyber)
                .setFooter(`from round ${args[1]}`);
            return message.channel.send(embed);
        } else if (args[2].includes('alt') || args[2].includes('abr')) {
            while (cashSoFar <= cashNeeded) {
                addToTotal = parseInt(abr[startRound][0]);
                cashSoFar += addToTotal;
                addToTotal = 0;
                startRound++;
                if (startRound > 100) {
                    let embed = new Discord.MessageEmbed()
                        .setTitle(`You cant get $${cashNeeded} before freeplay`)
                        .setColor(orange);
                    return message.channel.send(embed);
                }
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `You should get $${cashNeeded} by round ${startRound}`
                )
                .setColor(cyber)
                .setFooter(`in ABR, from round ${args[1]}`);
            return message.channel.send(embed);
        } else if (args[2].includes('ha') || args[2].includes('ca')) {
            while (cashSoFar <= cashNeeded) {
                addToTotal = parseInt(r[startRound].csh);
                cashSoFar += addToTotal / 2; // only difference
                addToTotal = 0;
                startRound++;
                if (startRound > 100) {
                    let embed = new Discord.MessageEmbed()
                        .setTitle(
                            `You cant get $${cashNeeded} from popping bloons from round ${startRound} before freeplay`
                        )
                        .setFooter('freeplay is random, hence cash is random')
                        .setColor(orange);
                    return message.channel.send(embed);
                }
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `You should get $${cashNeeded} by round ${startRound}`
                )
                .setColor(cyber)
                .setFooter(`in half cash, from round ${args[1]}`);
            return message.channel.send(embed);
        } else {
            invalidModeEmbed = new Discord.MessageEmbed()
                .setTitle('abr is the only other mode supported')
                .setDescription(
                    'Easy, Primary Only, Medium, Military Only, Hard, Magic Monkeys Only, Double HP MOABs, Impoppable and CHIMPS all are the "normal" modes'
                );
            return message.channel.send();
        }
    },
};
