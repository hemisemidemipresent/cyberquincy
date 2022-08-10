const income = require('../jsons/income-normal.json');
const abrincome = require('../jsons/income-abr.json');
const { cyber, orange } = require('../jsons/colours.json');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const RoundParser = require('../parser/round-parser');
const CashParser = require('../parser/cash-parser');
const AnyOrderParser = require('../parser/any-order-parser');
module.exports = {
    name: 'saveup',
    aliases: ['|', 'save'],
    async execute(message, args) {
        // standardization
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new CashParser(),
                new RoundParser('ALL'),
                new OptionalParser(
                    new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),
                    'CHIMPS' // default if not provided
                )
            )
        );

        if (parsed.hasErrors()) {
            return await module.exports.errorMessage(message, parsed.parsingErrors);
        }

        let cashNeeded = parsed.cash;
        let round = parsed.round;
        let embed;
        if (parsed.mode == 'abr') {
            if (round > 100) embed = this.freePlayMsg(cashNeeded, round);
            else embed = this.calculate(abrincome, round, cashNeeded, 1);
        } else if (round > 140) {
            embed = this.freePlayMsg(cashNeeded, round);
        } else if (parsed.mode == 'halfcash') {
            embed = this.calculate(income, round, cashNeeded, 0.5);
        } else {
            embed = this.calculate(income, round, cashNeeded, 1);
        }
        await message.channel.send({ embeds: [embed] });
    },
    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.EmbedBuilder()
            .setTitle('ERROR')
            .addFields([{ name: 'Likely Cause(s)', value: parsingErrors.join('\n') }])
            .setColor(cyber);

        return message.channel.send({ embeds: [errorEmbed] });
    },
    freePlayMsg(cashNeeded, round) {
        let embed = new Discord.EmbedBuilder()
            .setTitle(`You cant get $${cashNeeded} from popping bloons by round ${round}`)
            .setFooter({ text: 'freeplay is random, hence cash is random' })
            .setColor(orange);
        return embed;
    },
    calculate(r, round, cashNeeded, cashModifier) {
        let originalRound = round;
        round--; // we dont want to consider the income of the round that the user says it wants the cash before
        let cashSoFar = 0;
        while (cashSoFar <= cashNeeded) {
            addToTotal = parseInt(r[round].cashThisRound);
            cashSoFar += addToTotal * cashModifier;

            addToTotal = 0;
            round--;

            if (round < 1) {
                return this.freePlayMsg(cashNeeded, originalRound);
            }
        }
        round++; // the last round-- is unecessary. There is a better way to do this
        let embed = new Discord.EmbedBuilder()
            .setTitle(
                `You should get $${cashNeeded} BEFORE round ${originalRound} if you start saving up (popping) at round ${round}`
            )
            .setColor(cyber);
        return embed;
    }
};
