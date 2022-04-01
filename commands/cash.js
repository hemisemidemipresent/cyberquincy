const income = require('../jsons/income-normal.json');
const abrincome = require('../jsons/income-abr.json');
const { cyber, orange } = require('../jsons/colours.json');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const RoundParser = require('../parser/round-parser');
const CashParser = require('../parser/cash-parser');
const AnyOrderParser = require('../parser/any-order-parser');
module.exports = {
    name: 'cash',
    aliases: ['ca', 'k', 'cost'],
    async execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new CashParser(),
                new OptionalParser(
                    new ModeParser('CHIMPS', 'ABR', 'HALFCASH', 'PREDET_CHIMPS'),
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
            embed = this.calculate(cashNeeded, startRound, abrincome, 100, 1);
        } else if (parsed.mode == 'halfcash') {
            embed = this.calculate(cashNeeded, startRound, income, 140, 0.5);
        } else {
            embed = this.calculate(cashNeeded, startRound, income, 140, 1);
        }
        await message.reply({ embeds: [embed] });
    },
    async errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Likely Cause(s)', parsingErrors.join('\n'))
            .setColor(cyber);

        return await message.reply({ embeds: [errorEmbed] });
    },
    freePlayMsg(cashNeeded, round) {
        let embed = new Discord.MessageEmbed()
            .setTitle(`You cant get $${cashNeeded} from popping bloons from round ${round} before random freeplay`)
            .setFooter({ text: 'freeplay rounds are random, hence cash is random' })
            .setColor(orange);
        return embed;
    },
    calculate(cashNeeded, round, r, roundLimit, incomeMultiplier) {
        let cashSoFar = 0;
        let originalRound = round;
        while (cashSoFar <= cashNeeded) {
            addToTotal = parseInt(r[round].cashThisRound);
            cashSoFar += addToTotal * incomeMultiplier;
            addToTotal = 0;
            round++;
            if (round > roundLimit) {
                return module.exports.freePlayMsg(cashNeeded, originalRound);
            }
        }

        let embed = new Discord.MessageEmbed()
            .setTitle(
                `You should get $${cashNeeded} DURING round ${--round} (BEFORE round ${++round})\nstarting popping at ${originalRound}`
            )
            .setColor(cyber);
        return embed;
    }
};
