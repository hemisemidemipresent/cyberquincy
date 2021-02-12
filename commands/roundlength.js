const lengths = require('../jsons/roundlength.json');

const { red, lightgrey, grey } = require('../jsons/colours.json');

const RoundParser = require('../parser/round-parser');
const OptionalParser = require('../parser/optional-parser');
const ExactStringParser = require('../parser/string-set-values-parser');

module.exports = {
    name: 'roundlength',
    aliases: ['length', 'rl', 'l'],
    execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new RoundParser(),
            new OptionalParser(new RoundParser()),
            new OptionalParser(new ExactStringParser('-t'))
        );
        if (parsed.hasErrors()) {
            return errorMessage(message, parsed.parsingErrors);
        }

        if (parsed.rounds.length == 1) {
            let embed = oneRoundData(parsed);
            return message.channel.send(embed);
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
            let embed = new Discord.MessageEmbed()
                .setDescription(
                    `From round ${startRound} to ${endRound}, the longest round is round ${longestRound} which is ${
                        Math.round(longestLength * 100) / 100
                    }s long`
                )
                .setColor(grey);
            message.channel.send(embed);
        }
    },
};
/**
 *
 * @param {object} - parsed arguments
 * @returns {MesssageEmbed} - embed to send
 */
function oneRoundData(parsed) {
    let embed = new Discord.MessageEmbed()
        .setDescription(
            `round ${parsed.round} is ${
                lengths[parseInt(parsed.round) - 1]
            }s long`
        )
        .setColor(lightgrey);
    return embed;
}
/**
 *
 * @param {message} message
 * @param {parsingErrors} parsingErrors
 */
function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .setDescription(
            'q!roundlength <round> (shows the length of one round)\nq!roundlength <start round> <end round> (shows the longest round from startRound to endRound)\nq!roundlength <start round> <end round> -t (total)'
        )
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .setColor(red);

    return message.channel.send(errorEmbed);
}
