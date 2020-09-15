const r = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json');
const Discord = require('discord.js');
const { red, magenta, purple, yellow } = require('../jsons/colours.json');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const RoundParser = require('../parser/round-parser');
module.exports = {
    name: 'income',
    execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new RoundParser('ALL'),
            new RoundParser('ALL'),
            new OptionalParser(
                new ModeParser(),
                'CHIMPS' // default if not provided
            )
        );
        console.log(parsed.mode);
        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }
        let rounds = parsed.rounds.sort((a, b) => a - b);
        let startround = rounds[0];
        let endround = rounds[1];
        let mode = parsed.mode;

        if (mode == 'halfcash') {
            return module.exports.halfIncome(startround, endround);
        } else if (args[2].includes('def')) {
            return module.exports.deflation(message.channel);
        } else if (mode == 'abr') {
            return module.exports.ABRincome(startround, endround);
        } else if (mode == 'apopalypse') {
            return module.exports.apop(message.channel);
        } else {
            return module.exports.normalIncome(startround, endround);
        }
    },
    errorMessage(message, errors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle(`${errors.join('\n')}`)
            .addField(
                'find the cash from round X to round Y',
                '**q!income <startround> <endround>**'
            )
            .addField(
                'other difficulties',
                '**q!income <startround> <endround> <difficulty>**\n(<difficulty> includes deflation, half cash, abr, apop is random)'
            )
            .setColor(red);
        return message.channel.send(errorEmbed);
    },
    normalIncome(startround, endround) {
        let startroundObject = r[startround - 1]; // thats just how it works
        let endroundObject = r[endround];
        let income =
            endroundObject.cumulativeCash - startroundObject.cumulativeCash;
        let embed = new Discord.MessageEmbed()
            .setTitle(
                `$${
                    Math.trunc(income * 100) / 100
                } was made from popping round ${startround} to popping round ${endround}`
            )
            .setColor(magenta)
            .setFooter('not including starting cash');
        return message.channel.send(embed);
    },
    halfIncome(startround, endround) {
        let startroundObject = r[startround - 1]; // thats just how it works
        let endroundObject = r[endround];
        let income =
            endroundObject.cumulativeCash - startroundObject.cumulativeCash;
        let embed = new Discord.MessageEmbed()
            .setTitle(
                `$${
                    Math.trunc(income * 100) / 100
                } was made from popping round ${startround} to popping round ${endround}`
            )
            .setColor(magenta)
            .setFooter('not including starting cash');
        return message.channel.send(embed);
    },
    ABRincome(startround, endround) {
        // the data works in a way that basically means that its an array of arrays, ordered by round number
        let income = abr[endround - 2][1] - abr[startround - 3][1];
        let embed = new Discord.MessageEmbed()
            .setTitle(
                `$${
                    Math.trunc(income * 100) / 100
                } was made from popping round ${startround} to popping round ${endround}`
            )
            .setColor(yellow)
            .setFooter(
                'in alternate bloon rounds, not including starting cash'
            );
        return message.channel.send(embed);
    },
    deflation(channel) {
        let embed = new Discord.MessageEmbed()
            .setTitle(
                'The total amount of cash you have is the same as the start'
            )
            .setColor(purple)
            .setFooter('thats deflation for you');
        return channel.send(embed);
    },
    apop(channel) {
        let embed = new Discord.MessageEmbed()
            .setTitle(
                'In apopalypse, the bloons are random, hence the income is random'
            )
            .setColor(purple)
            .setFooter('thats apop for you');
        return channel.send(embed);
    },
};
