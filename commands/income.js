const r = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json');
const { red, magenta, purple, yellow } = require('../jsons/colours.json');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const RoundParser = require('../parser/round-parser');
const AnyOrderParser = require('../parser/any-order-parser');

const gHelper = require('../helpers/general.js');

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
                new RoundParser('PREDET'),
                new OptionalParser(new RoundParser('PREDET')),
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
                if ((startround > 100 || endround > 100) && mode == 'abr') {
                    return module.exports.errorMessage(message, [
                        '<round> cannot be greater than 100 if mode is abr'
                    ]) 
                }

                if (endround) {
                    embed = module.exports.income(startround, endround, mode);
                } else {
                    if (startround >= 6) {
                        embed = chincomeMessage(mode, startround)
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
                '`q!income <startround> <endround> {gamemode}` (Order doesnt matter)',
                'Cash generated from round <startround> to <endround> in specified gamemode or standard mode'
            )
            .addField(
                '`q!income <round> {gamemode}` (Order doesnt matter)',
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
                `$${Math.trunc(income * 100) / 100
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
                `$${Math.trunc(income * 100) / 100
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
                `$${Math.trunc(income * 100) / 100
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

    console.log(incomes);

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

    incomeEmbed = new Discord.MessageEmbed()
        .setTitle(`${mode_str_iden} CHIMPS Incomes (R${round})`)
        .setColor(colours['cyber'])
        .addField(
            `R${round}`,
            `${incomes.rincome}`
        )
    
    if (incomes.chincomeExclusive) {
        incomeEmbed.addField(
            `Start -> End R${round - 1}`,
            `${incomes.chincomeExclusive}`
        )
    }
        
    incomeEmbed.addField(
        `Start -> End R${round}`,
        `${incomes.chincomeInclusive}`
    );

    if (round < 100) {
        incomeEmbed.addField(
            `Start R${round} -> End R100`,
            incomes.lincomeInclusive
        )
    }
    if (round < 99) {
        incomeEmbed.addField(
            `Start R${round + 1} -> End R100`,
            incomes.lincomeExclusive
        )
    }
    if (round > 101) {
        incomeEmbed.addField(
            `Start R101 -> End R${round - 1}`,
            incomes.superChincomeExclusive
        )
    }
    if (round > 100) {
        incomeEmbed.addField(
            `Start R101 -> End R${round}`,
            incomes.superChincomeInclusive
        )
    }
    incomeEmbed.addField(
        `Start R${round} -> End R120`,
        incomes.superLincomeInclusive
    )
    if (round < 120) {
        incomeEmbed.addField(
            `Start R${round + 1} -> End R120`,
            incomes.superLincomeExclusive
        )
    }
    
    return incomeEmbed;
};

// rincome = round income
// chincome = cumulative income (CHIMPS with modifier specified by `mode`)
// lincome = left income (income left over i.e. cash from start of round to end of R100)
calculateIncomes = function (mode, round) {
    let incomes = {
        rincome: null,
        chincomeExclusive: null,
        chincomeInclusive: null,
        lincomeExclusive: null,
        lincomeInclusive: null,
        superChincomeExclusive: null,
        superChincomeInclusive: null,
        superLincomeInclusive: null,
        superLincomeExclusive: null,
    }

    if (mode == 'abr') {
        index = round - 2;

        chincome = abr[index][1] - abr[3][1] + 650;
        rincome = abr[index][0];
        lincome = abr[98][1] - abr[index - 1][1];
    } else {
        index = round;

        incomes.rincome = r[index].cashThisRound;
        if (round > 6) {
            incomes.chincomeExclusive = r[index - 1].cumulativeCash - r[5].cumulativeCash + 650;
        }
        incomes.chincomeInclusive = r[index].cumulativeCash - r[5].cumulativeCash + 650;
        if (round < 100) {
            incomes.lincomeInclusive = r[100].cumulativeCash - r[index - 1].cumulativeCash;
        }
        if (round < 99) {
            incomes.lincomeExclusive = r[100].cumulativeCash - r[index].cumulativeCash;
        }
        if (round > 101) {
            incomes.superChincomeExclusive = r[index - 1].cumulativeCash - r[101].cumulativeCash;
        }
        if (round > 100) {
            incomes.superChincomeInclusive = r[index].cumulativeCash - r[101].cumulativeCash;
        }
        incomes.superLincomeInclusive = r[120].cumulativeCash - r[index - 1].cumulativeCash;
        if (round < 120) {
            incomes.superLincomeExclusive = r[120].cumulativeCash - r[index].cumulativeCash;
        }

        if (mode == 'halfcash') {
            for (incomeType in incomes) {
                incomes[incomeType] /= 2;
            }
        }
    }

    for (incomeType in incomes) {
        if (incomes[incomeType]) {
            incomes[incomeType] = gHelper.numberAsCost(incomes[incomeType].toFixed(1));
        }
    }
    return incomes;
};
