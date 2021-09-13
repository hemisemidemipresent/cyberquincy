const AnyOrderParser = require('../parser/any-order-parser.js');
const NaturalNumberParser = require('../parser/natural-number-parser.js');
const OptionalParser = require('../parser/optional-parser.js');
const PersonParser = require('../parser/person-parser');
const OrParser = require('../parser/or-parser');

const gHelper = require('../helpers/general.js');
const race = require('../helpers/race');

const { red, cyber } = require('../jsons/colours.json');
const { discord } = require('../aliases/misc.json');

const raceImg =
    'https://static.wikia.nocookie.net/b__/images/4/40/EventRaceIcon.png/revision/latest/scale-to-width-down/340?cb=20200616225307&path-prefix=bloons';

module.exports = {
    name: 'raceleaderboard',
    aliases: ['leaderboard', 'lb'],
    casedArgs: true,
    async execute(message, args) {
        let raceID = 'Ready_Set_No_ktdogfkw';

        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return await module.exports.helpMessage(message);
        }

        cArgs = [...args];
        parsers = [
            new OptionalParser(
                new OrParser(
                    new PersonParser(),
                    new AnyOrderParser(
                        new NaturalNumberParser(),
                        new OptionalParser(new NaturalNumberParser())
                    )
                )
            ),
        ];
        const parsed = CommandParser.parse(
            args,
            new OptionalParser(
                new OrParser(
                    new PersonParser(),
                    new NaturalNumberParser(),
                    new AnyOrderParser(
                        new NaturalNumberParser(),
                        new NaturalNumberParser()
                    )
                )
            )
        );
        if (!parsed.person && !parsed.natural_number) {
        }
        if (parsed.hasErrors()) {
            // extremely hacky way to get the "out of order" term from a UserCommandError
            errMsg = parsed.parsingErrors[0].message;
            arr = errMsg.split(/ +/);
            if (errMsg.includes('user')) {
                raceID = arr[9];
            } else {
                position = parseInt(arr[5]);
                raceID = args[position - 1];
            }
        }
        let data;
        try {
            data = await race.getJSON(raceID);
        } catch {
            return await this.errorMessage(message, ['invalid race id']);
        }
        let scores = data.scores.equal;

        let output = '';

        if (parsed.person || parsed.natural_numbers.length == 1) {
            let person = parsed.person ?? 'alsmdakldaksndkansdkanskdanskda'; // ensures that person isnt null
            for (let i = 0; i < 100; i++) {
                if (!scores[i]) output = 'no one found';
                score = scores[i];
                let md = score.metadata.split(',');
                let username = md[0];
                if (
                    username.includes(person) ||
                    parsed.natural_number == i + 1
                ) {
                    output = `placement: ${gHelper.toOrdinalSuffix(
                        i + 1
                    )}\nname: ${username}\ntime: ${parsetime(
                        1000000000 - score.score
                    )}\nisNew: ${score.isNew}\nuserID: ${score.userID}`;
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

        if (output.length > 4096) {
            return module.exports.errorMessage(message, [
                'too many characters',
            ]);
        }
        let embed = new Discord.MessageEmbed()
            .setTitle(`ID: ${data.leaderboardID}`)
            .setURL(race.getURL(raceID))
            .setDescription('```' + output + '```')
            .setColor(cyber)
            .setTimestamp()
            .setThumbnail(raceImg);
        await message.channel.send({ embeds: [embed] });
    },
    errorMessage(message, errors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle(`${errors.join('\n')}`)
            .setDescription('BTD6 Race leaderboard loader')
            .addField(
                'Examples',
                '`q!lb 1 50` - shows lb from 1st place to 50th place\n' +
                    `\`q!lb ${raceID}\` - shows lb for given race ID. For list of race IDs see <#846647839312445451> in [this server](${discord})\n` +
                    `\`q!lb u#tsp\` - shows user placement`
            )

            .setColor(red);

        message.channel.send({ embeds: [errorEmbed] });
    },
    async helpMessage(message) {
        let embed = new Discord.MessageEmbed()
            .setTitle('`q!racelb` HELP')
            .setDescription('BTD6 Race leaderboard loader')
            .addField(
                'Examples',
                '`q!lb 1 50` - shows lb from 1st place to 50th place\n' +
                    `\`q!lb ${raceID}\` - shows lb for given race ID. For list of race IDs see <#846647839312445451> in [this server](${discord})\n` +
                    `\`q!lb u#tsp\` - shows user placement`
            );
        await message.channel.send(embed);
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
