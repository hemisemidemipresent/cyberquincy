const round2 = require('../jsons/round2.json');
const abrincome = require('../jsons/abrincome.json'); // array containing arrays, nth index is nth round, in the returned array 0th value is new cash, 1st value is total cash
const { cyber, orange } = require('../jsons/colours.json');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const RoundParser = require('../parser/round-parser');
const CashParser = require('../parser/cash-parser');
const AnyOrderParser = require('../parser/any-order-parser');
module.exports = {
    name: 'cash',
    aliases: ['ca', 'k', 'cost'],
    execute(message, args) {
        const r = round2.map((x) => x.cashThisRound);
        const abr = abrincome.map((x) => x[0]);
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new CashParser(),
                new OptionalParser(
                    new ModeParser(
                        'CHIMPS',
                        'ABR',
                        'HALFCASH',
                        'PREDET_CHIMPS'
                    ),
                    'CHIMPS' // default if not provided
                ),
                new RoundParser('ALL')
            )
        );

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        let cashNeeded = parsed.cash;
        let startRound = parsed.round;
        let embed;
        if (parsed.mode == 'abr') {
            embed = this.calculate(cashNeeded, startRound, abr, 100, 1);
        } else if (parsed.mode == 'halfcash') {
            embed = this.calculate(cashNeeded, startRound, r, 140, 0.5);
        } else {
            embed = this.calculate(cashNeeded, startRound, r, 140, 1);
        }
        message.reply({ embeds: [embed] });
    },
    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Likely Cause(s)', parsingErrors.join('\n'))
            .setColor(cyber);

        return message.reply({ embeds: [errorEmbed] });
    },
    freePlayMsg(cashNeeded, round) {
        let embed = new Discord.MessageEmbed()
            .setTitle(
                `You cant get $${cashNeeded} from popping bloons from round ${round} before random freeplay`
            )
            .setFooter('freeplay rounds are random, hence cash is random')
            .setColor(orange);
        return embed;
    },
    calculate(cashNeeded, round, r, roundLimit, incomeMultiplier) {
        let cashSoFar = 0;
        let originalRound = round;

        while (cashSoFar <= cashNeeded) {
            addToTotal = parseInt(r[round]);
            cashSoFar += addToTotal * incomeMultiplier;
            addToTotal = 0;
            round++;
            if (round > roundLimit) {
                return module.exports.freePlayMsg(cashNeeded, originalRound);
            }
        }

        let embed = new Discord.MessageEmbed()
            .setTitle(
                `You should get $${cashNeeded} before round ${round} starting at ${originalRound}`
            )
            .setColor(cyber);
        return embed;
    },
};
