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
    async execute(message, args) {
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
                    'chimps' // default if not provided
                )
            )
        );
        if (parsed.hasErrors()) {
            return await module.exports.errorMessage(
                message,
                parsed.parsingErrors
            );
        }
        const [startround, endround] = parsed.rounds.sort((a, b) => a - b);

        let mode = parsed.mode;

        let embed = null;

        if (startround < 3 && mode == 'abr') {
            return await module.exports.errorMessage(message, [
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
                    return await module.exports.errorMessage(message, [
                        '<round> cannot be greater than 100 if mode is abr',
                    ]);
                }

                if (endround) {
                    embed = module.exports.income(startround, endround, mode);
                } else {
                    if (startround >= 6) {
                        embed = chincomeMessage(mode, startround);
                    } else {
                        return await module.exports.errorMessage(message, [
                            '<round> must be at least 6 if only one round is specified',
                        ]);
                    }
                }
        }

        await message.channel.send({ embeds: [embed] });
    },
    async helpMessage(message) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('`q!income` HELP')
            .addField(
                '`q!income <startround> <endround> {gamemode}` (Order doesnt matter)',
                'Cash generated from round <startround> to <endround> in specified gamemode or standard mode'
            )
            .addField(
                '`q!income <round> {gamemode}` (Order doesnt matter)',
                'Provides a whole host of incomes revolving around the queried round and gamemode'
            )
            .addField('Ex. #1', '`q!income 8 64`')
            .addField('Ex. #2', '`q!income 69 94 halfcash`')
            .addField('Ex. #3', '`q!income 8`')
            .addField('Ex. #4', '`q!income 94 abr`')
            .setFooter(
                'Currently only supports hard difficulty.\nAlso, q!chincome has been combined into q!income.'
            );

        return await message.channel.send({ embeds: [errorEmbed] });
    },
    async errorMessage(message, errors) {
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

        await message.channel.send({ embeds: [errorEmbed] });
    },
    async income(startround, endround, mode) {
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

    const modeTitled = (function (mode) {
        switch (mode) {
            case 'halfcash':
                return 'Half Cash';
            case 'chimps':
                return 'Standard';
            default:
                return mode.toUpperCase();
        }
    })(mode);

    const asteriskMaybe = round == 6 ? '*' : '';

    incomeEmbed = new Discord.MessageEmbed()
        .setTitle(`${modeTitled} CHIMPS Incomes (R${round})`)
        .setColor(colours['cyber'])
        .addField(`R${round}`, `${incomes.rincome}`);

    if (incomes.chincomeExclusive) {
        incomeEmbed.addField(
            `Start -> End R${round - 1}`,
            `${incomes.chincomeExclusive}`
        );
    }

    incomeEmbed.addField(
        `Start -> End R${round}`,
        `${incomes.chincomeInclusive}`
    );

    if (round < 100) {
        incomeEmbed.addField(
            `Start R${round}${asteriskMaybe} -> End R100`,
            incomes.lincomeInclusive
        );
    }
    if (round < 99) {
        incomeEmbed.addField(
            `Start R${round + 1} -> End R100`,
            incomes.lincomeExclusive
        );
    }
    if (round > 100) {
        incomeEmbed.addField(
            `Start R101 -> End R${round}`,
            incomes.superChincomeInclusive
        );
    }
    if (mode !== 'abr') {
        incomeEmbed.addField(
            `Start R${round}${asteriskMaybe} -> End R140`,
            incomes.superLincomeInclusive
        );
    }
    if (round < 140 && mode !== 'abr') {
        incomeEmbed.addField(
            `Start R${round + 1} -> End R140`,
            incomes.superLincomeExclusive
        );
    }

    if (round === 6) {
        incomeEmbed.setFooter("*Doesn't include starting cash");
    }

    return incomeEmbed;
};

// rincome = round income
// chincome = cumulative income (CHIMPS with modifier specified by `mode`)
// lincome = left income (income left over i.e. cash from start of round to end of R100)
// super = rounds greater than 100
calculateIncomes = function (mode, round) {
    let incomes = {
        rincome: null,
        chincomeExclusive: null,
        chincomeInclusive: null,
        lincomeExclusive: null,
        lincomeInclusive: null,
        superChincomeInclusive: null,
        superLincomeInclusive: null,
        superLincomeExclusive: null,
    };

    if (mode == 'abr') {
        index = round - 2;

        incomes.rincome = abr[index][0];
        if (round > 6) {
            incomes.chincomeExclusive = abr[index - 1][1] - abr[3][1] + 650;
        }
        incomes.chincomeInclusive = abr[index][1] - abr[3][1] + 650;
        if (round < 100) {
            incomes.lincomeInclusive = abr[98][1] - abr[index - 1][1];
        }
        if (round < 99) {
            incomes.lincomeExclusive = abr[98][1] - abr[index][1];
        }
    } else {
        index = round;

        incomes.rincome = r[index].cashThisRound;
        if (round > 6) {
            incomes.chincomeExclusive =
                r[index - 1].cumulativeCash - r[5].cumulativeCash + 650;
        }
        incomes.chincomeInclusive =
            r[index].cumulativeCash - r[5].cumulativeCash + 650;
        if (round < 100) {
            incomes.lincomeInclusive =
                r[100].cumulativeCash - r[index - 1].cumulativeCash;
        }
        if (round < 99) {
            incomes.lincomeExclusive =
                r[100].cumulativeCash - r[index].cumulativeCash;
        }
        if (round > 100) {
            incomes.superChincomeInclusive =
                r[index].cumulativeCash - r[100].cumulativeCash;
        }
        incomes.superLincomeInclusive =
            r[140].cumulativeCash - r[index - 1].cumulativeCash;
        if (round < 140) {
            incomes.superLincomeExclusive =
                r[140].cumulativeCash - r[index].cumulativeCash;
        }

        if (mode == 'halfcash') {
            for (incomeType in incomes) {
                incomes[incomeType] /= 2;
            }
        }
    }

    for (incomeType in incomes) {
        if (incomes[incomeType]) {
            incomes[incomeType] = gHelper.numberAsCost(
                incomes[incomeType].toFixed(1)
            );
        }
    }
    return incomes;
};
