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
    aliases: ['chincome'],
    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new RoundParser('ALL'),
                new OptionalParser(new RoundParser('ALL')),
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

        let embed = null;

        if (startround < 3 && mode == 'abr') {
            return module.exports.errorMessage(message, [
                'There is no support for rounds 1 and 2 abr income calculation',
            ]);
        }

        switch (mode) {
            case 'deflation':
                embed = module.exports.deflation();
                break;
            case 'apopalypse':
                embed = module.exports.apop();
                break;
            default:
                if (endround) {
                    embed = module.exports.income(startround, endround, mode);
                } else {
                    if (startround >= 6) {
                        embed = message.channel.send(
                            chincomeMessage(mode, startround)
                        );
                    } else {
                        return module.exports.errorMessage(message, [
                            '<round> must be at least 6 if only one round is specified',
                        ]);
                    }
                }
        }

        message.channel.send(embed);
    },
    helpMessage(message) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('`q!income` HELP')
            .addField(
                '`q!income <startround> <endround> {gamemode}` (Order agnostic)',
                'Cash generated from round <startround> to <endround> in specified gamemode or standard mode'
            )
            .addField(
                '`q!income <round> {gamemode}` (Order agnostic)',
                'In specified gamemode or standard as default:' +
                    '  • Cash generated during round <round>\n' +
                    '  • Cash generated from start of round 6 through end of round <round>\n' +
                    '  • Cash generated from start of round <round> through end of round 100'
            )
            .addField('Ex. #1', '`q!income 8 64`')
            .addField('Ex. #2', '`q!income 69 94 halfcash`')
            .addField('Ex. #3', '`q!income 8`')
            .addField('Ex. #4', '`q!income 94 abr`')
            .setFooter(
                'Currently only supports hard difficulty.\nAlso, q!chincome has been combined into q!income.'
            );

        return message.channel.send(errorEmbed);
    },
    errorMessage(message, errors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle(`${errors.join('\n')}`)
            .addField(
                '**q!income <startround> <endround> {mode}**',
                'Find the cash from round X to round Y in specified gamemode or standard mode'
            )
            .addField(
                '**q!income <round> {mode}**',
                'Calculate key incomes in with CHIMPS rules, accounting for starting cash. Takes in specified gamemode or standard mode as default'
            )
            .setColor(red);

        message.channel.send(errorEmbed);
    },
    income(startround, endround, mode) {
        switch (mode) {
            case 'halfcash':
                return module.exports.halfIncome(startround, endround);
            case 'abr':
                return module.exports.abrIncome(startround, endround);
            default:
                return module.exports.normalIncome(startround, endround);
        }
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
            (endroundObject.cumulativeCash - startroundObject.cumulativeCash) /
            2;
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

chincomeMessage = function (mode, round) {
    incomes = calculateIncomes(mode, round);

    let mode_str_iden = (function (mode) {
        switch (mode) {
            case 'HALFCASH':
                return 'Half Cash';
            case 'CHIMPS':
                return 'Standard';
            default:
                return mode.toUpperCase();
        }
    })(mode);

    return new Discord.MessageEmbed()
        .setTitle(`${mode_str_iden} CHIMPS Income (R${round})`)
        .addField(
            `Income gained from just round ${round} itself`,
            `$${h.numberWithCommas(incomes.rincome)}`
        )
        .addField(
            `Total cash gained through the end of round ${round}`,
            `$${h.numberWithCommas(incomes.chincome)}`
        )
        .addField(
            `Income gained from start of round ${round} to end of R100`,
            `$${h.numberWithCommas(incomes.lincome)}`
        )
        .setColor(colours['cyber']);
};

// rincome = round income
// chincome = cumulative income (CHIMPS with modifier specified by `mode`)
// lincome = left income (income left over i.e. cash from start of round to end of R100)
calculateIncomes = function (mode, round) {
    chincome = null;
    rincome = null;

    if (mode == 'abr') {
        index = round - 2;

        chincome = abr[index][1] - abr[3][1] + 650;
        rincome = abr[index][0];
        lincome = abr[98][1] - abr[index - 1][1];
    } else {
        index = round;

        chincome = r[index].cumulativeCash - r[5].cumulativeCash + 650;
        rincome = r[index].cashThisRound;
        lincome = r[100].cumulativeCash - r[index - 1].cumulativeCash;

        if (mode == 'halfcash') {
            chincome /= 2;
            rincome /= 2;
            lincome /= 2;
        }
    }

    return {
        rincome: rincome.toFixed(1),
        chincome: chincome.toFixed(1),
        lincome: lincome.toFixed(1),
    };
};
