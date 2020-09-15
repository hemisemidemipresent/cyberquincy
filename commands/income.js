const r = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json');
const Discord = require('discord.js');
const { red, magenta, purple, yellow } = require('../jsons/colours.json');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const RoundParser = require('../parser/round-parser');
const AnyOrderParser = require('../parser/any-order-parser');
module.exports = {
    name: 'income',
    execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new RoundParser('ALL'),
                new RoundParser('ALL'),
                new OptionalParser(
                    new ModeParser(),
                    'CHIMPS' // default if not provided
                )
            )
        );
        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }
        const [startround, endround] = parsed.rounds.sort((a, b) => a - b);
        
        let mode = parsed.mode;

        embed = null;
        
        switch(mode) {
            case 'halfcash':
                embed = module.exports.halfIncome(startround, endround);
                break;
            case 'deflation':
                embed = module.exports.deflation();
                break;
            case 'abr':
                embed = module.exports.abrIncome(startround, endround);
                break;
            case 'apopalypse':
                embed = module.exports.apop();
                break;
            default:
                embed = module.exports.normalIncome(startround, endround);
                break;
        }

        message.channel.send(embed)
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
        
        message.channel.send(errorEmbed);
    },
    normalIncome(startround, endround) {
        let startroundObject = r[startround - 1]; // thats just how it works
        let endroundObject = r[endround];
        let income =
            endroundObject.cumulativeCash - startroundObject.cumulativeCash;
        return new Discord.MessageEmbed()
            .setTitle(
                `$${
                    Math.trunc(income * 100) / 100
                } was made from popping round ${startround} to popping round ${endround}`
            )
            .setColor(magenta)
            .setFooter('not including starting cash');
    },
    halfIncome(startround, endround) {
        let startroundObject = r[startround - 1]; // thats just how it works
        let endroundObject = r[endround];
        let income =
            (endroundObject.cumulativeCash - startroundObject.cumulativeCash)/2;
        return new Discord.MessageEmbed()
            .setTitle(
                `$${
                    Math.trunc(income * 100) / 100
                } was made from popping round ${startround} to popping round ${endround}`
            )
            .setColor(magenta)
            .setFooter('not including starting cash');
    },
    abrIncome(startround, endround) {
        // the data works in a way that basically means that its an array of arrays, ordered by round number
        let income = abr[endround - 2][1] - abr[startround - 3][1];
        return new Discord.MessageEmbed()
            .setTitle(
                `$${
                    Math.trunc(income * 100) / 100
                } was made from popping round ${startround} to popping round ${endround}`
            )
            .setColor(yellow)
            .setFooter(
                'in alternate bloon rounds, not including starting cash'
            );
    },
    deflation() {
        return new Discord.MessageEmbed()
            .setTitle(
                'The total amount of cash you have is the same as the start'
            )
            .setColor(purple)
            .setFooter('thats deflation for you');
    },
    apop() {
        return new Discord.MessageEmbed()
            .setTitle(
                'In apopalypse, the bloons are random, hence the income is random'
            )
            .setColor(purple)
            .setFooter('thats apop for you');
    },
};
