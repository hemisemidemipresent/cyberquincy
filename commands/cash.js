const r = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json'); // array containing arrays, nth index is nth round, in the returned array 0th value is new cash, 1st value is total cash
const Discord = require('discord.js');
const { cyber, orange } = require('../jsons/colours.json');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const RoundParser = require('../parser/round-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
const AnyOrderParser = require('../parser/any-order-parser');
module.exports = {
    name: 'cash',
    aliases: ['ca', 'k', 'cost'],
    execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new NaturalNumberParser(1, Infinity),
                new OptionalParser(
                    new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),
                    'CHIMPS' // default if not provided
                ),
                new RoundParser('ALL')
            )
        );

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        let cashNeeded = parsed.natural_number;
        let startRound = parsed.round;
        let cashSoFar = 0;
        let addToTotal = 0;
        if (parsed.mode == 'abr') {
            while (cashSoFar <= cashNeeded) {
                addToTotal = parseInt(abr[startRound][0]);
                cashSoFar += addToTotal;
                addToTotal = 0;
                startRound++;
                if (startRound > 100) {
                    return module.exports.freePlayMsg(
                        message,
                        cashNeeded,
                        parsed.round
                    );
                }
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `You should get $${cashNeeded} by round ${startRound}`
                )
                .setColor(cyber)
                .setFooter(`in ABR, from round ${args[1]}`);
            return message.channel.send(embed);
        } else if (parsed.mode == 'halfcash') {
            while (cashSoFar <= cashNeeded) {
                addToTotal = parseInt(r[startRound].csh);
                cashSoFar += addToTotal / 2; // only difference
                addToTotal = 0;
                startRound++;
                if (startRound > 100) {
                    return module.exports.freePlayMsg(
                        message,
                        cashNeeded,
                        parsed.round
                    );
                }
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `You should get $${cashNeeded} by round ${startRound}`
                )
                .setColor(cyber)
                .setFooter(`in half cash, from round ${args[1]}`);
            return message.channel.send(embed);
        } else {
            while (cashSoFar <= cashNeeded) {
                addToTotal = parseInt(r[startRound].csh);
                cashSoFar += addToTotal;
                addToTotal = 0;
                startRound++;
                if (startRound > 100) {
                    return module.exports.freePlayMsg(
                        message,
                        cashNeeded,
                        parsed.round
                    );
                }
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(
                    `You should get $${cashNeeded} by round ${startRound}`
                )
                .setColor(cyber)
                .setFooter(`from round ${args[1]}`);
            return message.channel.send(embed);
        }
    },
    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Likely Cause(s)', parsingErrors.join('\n'))
            .setColor(cyber);

        return message.channel.send(errorEmbed);
    },
    freePlayMsg(message, cashNeeded, round) {
        let embed = new Discord.MessageEmbed()
            .setTitle(
                `You cant get $${cashNeeded} from popping bloons from round ${round} before freeplay`
            )
            .setFooter('freeplay is random, hence cash is random')
            .setColor(orange);
        return message.channel.send(embed);
    },
};
