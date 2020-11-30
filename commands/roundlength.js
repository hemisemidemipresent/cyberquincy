const lengths = require('../jsons/roundlength.json');
const { red, lightgrey, grey } = require('../jsons/colours.json');
const RoundParser = require('../parser/round-parser');
const OptionalParser = require('../parser/optional-parser');
module.exports = {
    name: 'roundlength',
    aliases: ['length', 'rl', 'l'],
    execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new RoundParser(),
            new OptionalParser(new RoundParser())
        );
        if (parsed.hasErrors()) {
            let errorEmbed = new Discord.MessageEmbed()
                .setDescription(
                    'q!roundlength <start round> <end round> (shows the longest round)'
                )
                .setColor(red);
            return message.channel.send(errorEmbed);
        }
        if (parsed.rounds.length == 1) {
            let embed = new Discord.MessageEmbed()
                .setDescription(
                    `round ${parsed.round} is ${
                        lengths[parseInt(parsed.round) - 1]
                    }s long`
                )
                .setColor(lightgrey);
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
