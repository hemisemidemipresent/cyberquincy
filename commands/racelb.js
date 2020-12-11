const request = require('request');
const AnyOrderParser = require('../parser/any-order-parser.js');

const NaturalNumberParser = require('../parser/natural-number-parser.js');
const OptionalParser = require('../parser/optional-parser.js');
const OrParser = require('../parser/or-parser.js');
const { red } = require('../jsons/colours.json');
module.exports = {
    name: 'raceleaderboard',
    aliases: ['leaderboard', 'lb', 't100'],

    async execute(message, args) {
        const parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new OptionalParser(new NaturalNumberParser(1, 99)),

                new OptionalParser(new NaturalNumberParser(1, 99))
            )
        );
        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }
        let nums = [];
        if (parsed.natural_numbers !== undefined) {
            nums = parsed.natural_numbers.sort();
        }
        let start = 1;
        let end = 50;
        if (nums.length == 1) {
            end = nums[0];
        } else if (nums.length == 2) {
            start = nums[0];
            end = nums[1];
        }
        let url =
            'https://priority-static-api.nkstatic.com/storage/static/appdocs/11/leaderboards/Race_WorkingOnForm_ki9pdqx4.json';

        request(url, (err, res, body) => {
            if (err) {
                reject('req');
            }
            let data = JSON.parse(JSON.parse(body).data);
            let scores = data.scores.equal;

            let output = '';
            for (let i = start - 1; i < end; i++) {
                let time = 1000000000 - scores[i].score;

                time = parsetime(time);
                let md = scores[i].metadata.split(',');
                let username = md[0];
                let row = '';
                row += addSpaces(i + 1, 2) + '|';
                row += addSpaces(username, 20);
                row += '|';
                row += time;
                row += '\n';
                output += row;
            }
            if (output.length > 2000) {
                return module.exports.errorMessage(message, [
                    'too many characters',
                ]);
            }
            message.channel.send('```' + output + '```');
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
    } catch {
        console.log(str);
    }

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
