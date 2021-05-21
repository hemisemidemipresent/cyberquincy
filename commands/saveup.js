const round2 = require('../jsons/round2.json');
const abrincome = require('../jsons/abrincome.json'); // array containing arrays, nth index is nth round, in the returned array 0th value is new cash, 1st value is total cash
const { cyber, orange } = require('../jsons/colours.json');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const RoundParser = require('../parser/round-parser');
const CashParser = require('../parser/cash-parser');
const AnyOrderParser = require('../parser/any-order-parser');
module.exports = {
    name: 'saveup',
    aliases: ['|', 'save'],
    execute(message, args) {
        // standardization
        const r = round2.map((x) => x.cashThisRound);
        const abr = abrincome.map((x) => x[0]);
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new CashParser(),
                new OptionalParser(
                    new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),
                    'CHIMPS' // default if not provided
                ),
                new RoundParser('PREDET')
            )
        );

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        let cashNeeded = parsed.cash;
        let round = parsed.round;
        let embed;
        if (parsed.mode == 'abr') {
            if (round > 100) {
                embed = this.freePlayMsg(cashNeeded, round);
            } else embed = module.exports.calculate(abr, round, cashNeeded, 1);
        } else if (parsed.mode == 'halfcash') {
            if (round > 120) {
                embed = this.freePlayMsg(cashNeeded, round);
            } else embed = module.exports.calculate(r, round, cashNeeded, 0.5);
            return message.channel.send(embed);
        } else {
            if (round > 120) {
                embed = this.freePlayMsg(cashNeeded, round);
            } else embed = module.exports.calculate(r, round, cashNeeded, 1);
        }
        message.channel.send(embed);
    },
    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Likely Cause(s)', parsingErrors.join('\n'))
            .setColor(cyber);

        return message.channel.send(errorEmbed);
    },
    freePlayMsg(cashNeeded, round) {
        let embed = new Discord.MessageEmbed()
            .setTitle(
                `You cant get $${cashNeeded} from popping bloons before round ${round}`
            )
            .setFooter('freeplay is random, hence cash is random')
            .setColor(orange);
        return embed;
    },
    calculate(r, round, cashNeeded, cashModifier) {
        round--; // we dont want to consider the income of the round that the user says it wants the cash before
        let cashSoFar = 0;
        while (cashSoFar <= cashNeeded) {
            addToTotal = parseInt(r[round]);
            cashSoFar += addToTotal * cashModifier;
            console.log(addToTotal, cashSoFar, round);

            addToTotal = 0;
            round--;

            if (round < 1) {
                return module.exports.freePlayMsg(cashNeeded, parsed.round);
            }
        }
        round++; // the last round-- is unecessary. There is a better way to do this
        let embed = new Discord.MessageEmbed()
            .setTitle(
                `You should get $${cashNeeded} if you start saving up at ${round}`
            )
            .setColor(cyber);
        return embed;
    },
};
