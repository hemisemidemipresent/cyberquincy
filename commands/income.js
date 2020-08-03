const r = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json');
const Discord = require('discord.js');
const { red, magenta, purple, yellow } = require('../jsons/colours.json');
module.exports = {
    name: 'income',
    execute(message, args) {
        if (!args[0] || isNaN(args[0]) || args[0] < -1 || args[0] > 100) {
            // error case
            let errorEmbed = new Discord.MessageEmbed()
                .addField(
                    'find the cash from round X to round Y',
                    'q!income <startround> <endround>\n(if startround = 0, that means starting cash is included)'
                )
                .addField(
                    'other difficulties',
                    'q!income <startround> <endround> <difficulty>\n(<difficulty> includes starting cash; deflation, half cash, abr, apop is random)'
                )
                .addField('example', 'q!income 7 89 abr')
                .setColor(red);
            return message.channel.send(errorEmbed);
        } else if (!args[1] || isNaN(args[1]) || args[1] < 0 || args[1] > 100) {
            // another error case
            let errorEmbed = new Discord.MessageEmbed()
                .setTitle('Please specify a round from 1 to 100.')
                .addField(
                    'find the cash from round X to round Y',
                    '**q!income <startround> <endround>**'
                )
                .addField(
                    'other difficulties',
                    '**q!income <startround> <endround> <difficulty>**\n(<difficulty> includes starting cash; deflation, half cash, abr, apop is random)'
                )
                .setColor(red);
            return message.channel.send(errorEmbed);
        }

        let endround = parseInt(args[1]);
        if (!args[2]) {
            let normalStartRound = parseInt(args[0]) - 1; // thats just how it works
            let startroundObject = r[normalStartRound];
            let endroundObject = r[endround];
            let income = endroundObject.cch - startroundObject.cch;
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `$${
                        Math.trunc(income * 100) / 100
                    } was made from popping round ${
                        normalStartRound + 1
                    } to popping round ${endround}`
                )
                .setColor(magenta)
                .setFooter('not including starting cash');
            return message.channel.send(embed);
        } else if (args[2].includes('def')) {
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    'The total amount of cash you have is the same as the start'
                )
                .setColor(purple)
                .setFooter('thats deflation for you');
            return message.channel.send(embed);
        } else if (args[2].includes('alt') || args[2].includes('abr')) {
            let startround = parseInt(args[0]) - 1;
            let startroundObject = abr[startround - 2]; // the data works in a way that basically means that its an array of arrays, ordered by round number
            let endroundObject = abr[endround - 2];
            let income = endroundObject[1] - startroundObject[1];
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `$${
                        Math.trunc(income * 100) / 100
                    } was made from popping round ${
                        startround + 1
                    } to popping round ${endround}`
                )
                .setColor(yellow)
                .setFooter(
                    'in alternate bloon rounds, not including starting cash'
                );
            return message.channel.send(embed);
        }
    },
};
