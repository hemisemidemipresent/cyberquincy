const round2 = require('../jsons/round2.json');
const { cyber } = require('../jsons/colours.json');
const r1 = require('../jsons/rounds.json');
const round = require('../jsons/rounds_topper.json');
const BloonParser = require('../parser/bloon-parser');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const AnyOrderParser = require('../parser/any-order-parser');
module.exports = {
    name: 'bloon',
    aliases: ['bln'],
    execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new OptionalParser(
                    new ModeParser('CHIMPS', 'ABR'),
                    'CHIMPS' // default if not provided
                ),
                new BloonParser()
            )
        );
        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }
        let object;
        if (parsed.mode == 'CHIMPS') {
            object = round.reg;
        } else {
            object = round.alt;
        }

        function getOccurences(bloon, arrayOfRounds) {
            let occurences = [];
            for (let i = 0; i < 100; i++) {
                roundArray = arrayOfRounds[`${i + 1}`];
                for (let j = 0; j < roundArray.length; j++) {
                    bloonset = roundArray[j][0];
                    if (bloonset.includes(bloon)) {
                        res = [i + 1, bloonset];
                        occurences.push(res);
                    }
                }
            }
            return occurences;
        }

        let occurences = getOccurences(parsed.bloon, object);

        message.channel.send(JSON.stringify(occurences));
    },
    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Likely Cause(s)', parsingErrors.join('\n'))
            .setColor(cyber);
        return message.channel.send(errorEmbed);
    },
};
