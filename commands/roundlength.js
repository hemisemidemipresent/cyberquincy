const roundlength = require('../jsons/roundlength.json');

const { red, lightgrey, grey } = require('../jsons/colours.json');

const RoundParser = require('../parser/round-parser');
const OptionalParser = require('../parser/optional-parser');
const ExactStringParser = require('../parser/string-set-values-parser');
const ModeParser = require('../parser/mode-parser');

module.exports = {
    name: 'roundlength',
    aliases: ['length', 'rl', 'l'],
    async execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new RoundParser(),
            new OptionalParser(new RoundParser()),
            new OptionalParser(new ExactStringParser('-t')),
            new OptionalParser(new ModeParser('abr'))
        );
        if (parsed.hasErrors()) {
            return await errorMessage(message, parsed.parsingErrors);
        }
        if (!parsed.mode) parsed.mode = 'chimps';
        let lengths = roundlength[parsed.mode];
        if (parsed.rounds.length == 1) {
            let embed = oneRoundData(parsed, lengths);
            return await message.channel.send({ embeds: [embed] });
        } else {
            let startRound = parsed.rounds[0];
            let endRound = parsed.rounds[1];
            let longestRound = 0;
            let longestLength = 0;
            for (i = startRound; i < endRound; i++) {
                if (longestLength < lengths[i]) {
                    longestLength = lengths[i];
                    longestRound = i + 1;
                }
            }
            let embed = new Discord.EmbedBuilder()
                .setDescription(
                    `From round ${startRound} to ${endRound}, the longest round is round ${longestRound} which is ${
                        Math.round(longestLength * 100) / 100
                    }s long`
                )
                .setColor(grey);
            await message.channel.send({ embeds: [embed] });
        }
    }
};
/**
 *
 * @param {object} - parsed arguments
 * @returns {MesssageEmbed} - embed to send
 */
function oneRoundData(parsed, lengths) {
    let embed = new Discord.EmbedBuilder()
        .setDescription(`round ${parsed.round} is ${lengths[parseInt(parsed.round) - 1]}s long`)
        .setColor(lightgrey);
    return embed;
}
/**
 *
 * @param {message} message
 * @param {parsingErrors} parsingErrors
 */
async function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.EmbedBuilder()
        .setTitle('ERROR')
        .setDescription(
            'q!roundlength <round> (shows the length of one round)\nq!roundlength <start round> <end round> (shows the longest round from startRound to endRound)\nq!roundlength <start round> <end round> -t (total)'
        )
        .addFields([{ name: 'Likely Cause(s)', value: parsingErrors.map((msg) => ` • ${msg}`).join('\n') }])
        .setColor(red);

    return await message.channel.send({ embeds: [errorEmbed] });
}
