const { cyber } = require('../jsons/colors.json');
const round = require('../jsons/rounds_topper.json');
const BloonParser = require('../parser/bloon-parser');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const AnyOrderParser = require('../parser/any-order-parser');
const { turq } = require('../jsons/colors.json');
module.exports = {
    name: 'bloon',
    aliases: ['bln'],
    async execute(message, args) {
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
            return await module.exports.errorMessage(message, parsed.parsingErrors);
        }
        let object;
        if (parsed.mode == 'CHIMPS') object = round.reg;
        else object = round.alt;

        function getOccurences(bloon, arrayOfRounds, mode) {
            let occurences = [];
            // for (let i = 0; i < mode == 'CHIMPS' ? 140 : 100; i++) {
            for (let i = 0; i < (mode == 'CHIMPS' ? 140 : 100); i++) {
                roundArray = arrayOfRounds[`${i + 1}`];
                roundRes = [i + 1];
                // console.log(roundArray);
                for (let j = 0; j < roundArray.length; j++) {
                    bloonType = roundArray[j][0].toString();
                    if (bloonType.includes(bloon)) {
                        let number = roundArray[j][1]; // number of bloonType
                        res = [number, bloonType];

                        roundRes.push(res);
                    }
                }
                if (roundRes[1]) occurences.push(roundRes);
            }
            return occurences;
        }
        function format(arr) {
            if (!occurences) {
                throw console.log(
                    `at bloon_occurences.js there is no occurences. Something went through the parser without it detecting. content:${message.content}`
                );
            }
            let bloonType = arr[0][1][1];
            let output = '';
            for (i = 0; i < arr.length; i++) {
                output += '\n';
                output += `Round ${arr[i][0]} : `;
                output += '`{';

                for (j = 1; j < arr[i].length; j++) {
                    output += `${arr[i][j][0]} ${arr[i][j][1]}`;
                    if (j + 1 !== arr[i].length) {
                        // checks for last entry
                        output += ' ';
                    }
                }
                output += '}`';
            }
            let embed = new Discord.EmbedBuilder()
                .setTitle(`Occurences of ${bloonType}`)
                .setDescription(output)
                .addFields([
                    {
                        name: '"abbreviations"',
                        value: 'c-red - camo red; r-red - regrow red; f-moab - fortified moab; cr-red - camo regrow red'
                    }
                ])
                .setFooter({ text: 'each space represents a different set of bloons. For more info use q!round <round>' })
                .setColor(turq);
            return embed;
        }

        let occurences = getOccurences(parsed.bloon.toString(), object, parsed.mode);
        let output = format(occurences);

        await message.channel.send({ embeds: [output] });
    },
    async errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.EmbedBuilder()
            .setTitle('ERROR')
            .addFields([{ name: 'Likely Cause(s)', value: parsingErrors.join('\n') }])
            .setColor(cyber);
        return await message.channel.send({ embeds: [errorEmbed] });
    }
};
