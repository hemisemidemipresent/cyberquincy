const request = require('request');
const AnyOrderParser = require('../parser/any-order-parser.js');

const NaturalNumberParser = require('../parser/natural-number-parser.js');
const OptionalParser = require('../parser/optional-parser.js');
const AnythingParser = require('../parser/anything-parser');
const PersonParser = require('../parser/person-parser');
const OrParser = require('../parser/or-parser');
const { red, cyber } = require('../jsons/colours.json');
const raceImg =
    'https://static.wikia.nocookie.net/b__/images/4/40/EventRaceIcon.png/revision/latest/scale-to-width-down/340?cb=20200616225307&path-prefix=bloons';
module.exports = {
    name: 'raceleaderboard',
    aliases: ['leaderboard', 'lb', 't100'],
    casedArgs: true,
    rawArgs: true,
    async execute(message, args) {
        let raceID = 'krfl1to5';
        const parsed = CommandParser.parse(
            args,
            new OrParser(
                new AnyOrderParser(
                    new OptionalParser(new NaturalNumberParser(1, 99)),

                    new OptionalParser(new NaturalNumberParser(1, 99)),
                    new OptionalParser(new AnythingParser())
                ),
                new AnyOrderParser(
                    new OptionalParser(new PersonParser()),
                    new OptionalParser(new AnythingParser())
                )
            )
        );

        if (parsed.anything) {
            raceID = parsed.anything;
        }

        let url = `https://priority-static-api.nkstatic.com/storage/static/appdocs/11/leaderboards/Race_${raceID}.json`;
        request(url, (err, res, body) => {
            if (err) {
                reject('req');
            }
            let data;

            try {
                data = JSON.parse(JSON.parse(body).data);
            } catch {
                return message.channel.send(
                    'invalid race id. To see all race ids join the discord server by running `q!server`'
                );
            }

            let scores = data.scores.equal;

            let output = '';

            if (parsed.person) {
                for (let i = 0; i < 100; i++) {
                    if (!scores[i]) output = 'no one found';

                    let md = score.metadata.split(',');
                    let username = md[0];
                    if (username.includes(parsed.person)) {
                        output = formatPersan(message, scores[i], 24, i);
                        break;
                    }
                }
            } else {
                let nums = [];
                if (parsed.natural_numbers !== undefined) {
                    nums = parsed.natural_numbers.sort();
                }
                let start = 1;
                let end = 50;
                if (nums.length == 1) end = nums[0];
                else if (nums.length == 2) {
                    start = nums[0];
                    end = nums[1];
                }
                // get max length of names, there is probably a more efficient way but heh
                let maxLength = 0;

                for (let i = start - 1; i < end; i++) {
                    if (!scores[i]) break;
                    let md = scores[i].metadata.split(',');
                    let username = md[0];
                    if (username.length > maxLength) {
                        maxLength = username.length;
                    }
                }
                for (let i = start - 1; i < end; i++) {
                    if (!scores[i]) break;
                    let row = formatPersan(message, scores[i], maxLength, i);
                    output += row;
                }
            }

            if (output.length > 2000) {
                return module.exports.errorMessage(message, [
                    'too many characters',
                ]);
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(`ID: ${data.leaderboardID}`)
                .setURL(url)
                .setDescription('```' + output + '```')
                .setColor(cyber)
                .setTimestamp()
                .setThumbnail(raceImg);
            message.channel.send(embed).then((msg) => {
                msg.react('❌');
                let filter = (reaction, user) => {
                    return (
                        reaction.emoji.name === '❌' &&
                        user.id === message.author.id
                    );
                };
                const collector = msg.createReactionCollector(filter, {
                    time: 20000,
                });

                collector.on('collect', () => {
                    msg.delete();
                });
            });
        });
    },
    errorMessage(message, errors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle(`${errors.join('\n')}`)
            .addField(
                '**q!lb [startingPlacement] [endingPlacement]**',
                'both `startingPlacement` and `endingPlacement` are optional - they default to 1 and 50 respectively'
            )

            .setColor(red);

        message.channel.send(errorEmbed);
    },
};
function addSpaces(str, max) {
    if (str == null || !str) {
        str = ' '.repeat(max);
        return str;
    }
    let diff = max - str.toString().length;

    try {
        str += ' '.repeat(diff);
    } catch {}

    return str;
}
function parsetime(ms) {
    let milliseconds = ms % 1000;
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    milliseconds = milliseconds < 100 ? '0' + milliseconds : milliseconds;
    return minutes + ':' + seconds + '.' + milliseconds;
}
function formatPersan(message, score, maxLength, i) {
    let time = 1000000000 - score.score;

    time = parsetime(time);
    let md = score.metadata.split(',');
    let username;
    if (
        message.author.id == '279126808455151628' ||
        message.author.id == '217726724752932864'
    ) {
        let userid = score.userID;
        if (
            userid == '5b7f82e318c7cbe32fa01e4e' ||
            userid == '5b2845abfcd0f8d9745e6cfe'
        ) {
            username = md[0];
        } else {
            username = '???';
        }
    } else {
        username = md[0];
    }
    let row = '';
    row += addSpaces(i + 1, 2) + '|';
    row += addSpaces(username, maxLength);
    row += '|';
    row += time;
    row += '\n';
    return row;
}
