const AnyOrderParser = require('../parser/any-order-parser.js');
const NaturalNumberParser = require('../parser/natural-number-parser.js');
const OptionalParser = require('../parser/optional-parser.js');
const PersonParser = require('../parser/person-parser');
const OrParser = require('../parser/or-parser');

const gHelper = require('../helpers/general.js');
const race = require('../helpers/race');

const { red, cyber } = require('../jsons/colours.json');
const { discord } = require('../aliases/misc.json');

const seclateServerID = '543957081183617024';
const Emojis = require('../jsons/emojis.json');
const raceEmojis = Emojis[seclateServerID + ''].race;

const raceImg =
    'https://static.wikia.nocookie.net/b__/images/4/40/EventRaceIcon.png/revision/latest/scale-to-width-down/340?cb=20200616225307&path-prefix=bloons';
const id = 'IceAge';
module.exports = {
    name: 'raceleaderboard',
    aliases: ['leaderboard', 'lb'],
    casedArgs: true,
    async execute(message, args) {
        let raceID = 'ku7sesrm';

        if (args.length == 1 && args[0] === 'help') {
            return await module.exports.helpMessage(message);
        }

        const parsed = CommandParser.parse(
            args,
            new OptionalParser(
                new OrParser(
                    new PersonParser(),
                    new NaturalNumberParser(1, 100),
                    new AnyOrderParser(
                        new NaturalNumberParser(1, 100),
                        new NaturalNumberParser(1, 100)
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
        if (parsed.person || parsed.natural_numbers?.length == 1) {
            let person = parsed.person ?? 'alsmdakldaksndkansdkanskdanskda'; // ensures that person isnt null
            for (let i = 0; i < 100; i++) {
                if (!scores[i]) output = 'no one found';
                score = scores[i];
                let md = score.metadata.split(',');
                let username = md[0];
                let timestamp;

                if (!md[0]) username = '???';

                try {
                    timestamp = new Date(parseInt(md[11])).toISOString();
                } catch {
                    timestamp = 'not available';
                }
                if (
                    username.includes(person) ||
                    parsed.natural_number == i + 1
                ) {
                    output = `placement: ${gHelper.toOrdinalSuffix(
                        i + 1
                    )}\nname: ${username}\ntime: ${parsetime(
                        1000000000 - score.score
                    )}\nisNew: ${score.isNew}\nuserID: ${
                        score.userID
                    }\ntimestamp: ${timestamp}\nmedals:\n${formatMedals(md)}`;
                    let embed = new Discord.MessageEmbed()
                        .setTitle(`ID: ${data.leaderboardID}`)
                        .setURL(race.getURL(raceID))
                        .setDescription(output)
                        .addField(
                            'did you know there is a website for this',
                            'check out https://btd6racelb.netlify.app/'
                        )
                        .addField(
                            'Timestamps are known to be inaccurate',
                            'see [this video](https://youtu.be/IGE155tCmss)'
                        )
                        .setColor(cyber)
                        .setTimestamp()
                        .setThumbnail(raceImg);
                    return await message.channel.send({ embeds: [embed] });
                }
            }
        } else if (!parsed.natural_numbers) {
            let o1 = getLB(1, 50, scores);
            let o2 = getLB(51, 100, scores);
            let embed1 = new Discord.MessageEmbed()
                .setTitle(`ID: ${data.leaderboardID}`)
                .setURL(race.getURL(raceID))
                .setDescription('```' + o1 + '```')
                .addField(
                    'did you know there is a website for this',
                    'check out https://btd6racelb.netlify.app/'
                )
                .addField(
                    'Timestamps are known to be inaccurate',
                    'see [this video](https://youtu.be/IGE155tCmss)'
                )
                .setFooter(
                    'this is what everyone outside top 100 sees the leaderboard as (updated every 15 mins)'
                )
                .setColor(cyber)
                .setTimestamp()
                .setThumbnail(raceImg);
            console.log('l');
            let botMessage = await message.channel.send({ embeds: [embed1] });
            return;
        } else {
            let nums = [];
            nums = parsed.natural_numbers;

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
                let row = formatPersan(scores[i], maxLength, i);
                output += row;
            }
        }

        if (output.length > 4096) {
            return await module.exports.errorMessage(message, [
                'too many characters',
            ]);
        }
        let embed = new Discord.MessageEmbed()
            .setTitle(`ID: ${data.leaderboardID}`)
            .setURL(race.getURL(raceID))
            .setDescription('```' + output + '```')
            .addField(
                'did you know there is a website for this',
                'check out https://btd6racelb.netlify.app/'
            )
            .addField(
                'Timestamps are known to be inaccurate',
                'see [this video](https://youtu.be/IGE155tCmss)'
            )
            .setFooter(
                'this is what everyone outside top 100 sees the leaderboard as (updated every 15 mins)'
            )
            .setColor(cyber)
            .setTimestamp()
            .setThumbnail(raceImg);
        await message.channel.send({ embeds: [embed] });
    },
    async errorMessage(message, errors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle(`${errors.join('\n')}`)
            .setDescription('BTD6 Race leaderboard loader')
            .addField(
                'Examples',
                '`q!lb 1 50` - shows lb from 1st place to 50th place\n' +
                    `\`q!lb ${id}\` - shows lb for given race ID. For list of race IDs see <#846647839312445451> in [this server](${discord})\n` +
                    `\`q!lb u#tsp\` - shows user placement`
            )
            .setColor(red)
            .setFooter(
                'this is what everyone outside top 100 sees the leaderboard as (updated every 15 mins), if you are in t100 the lb you see is more accurate'
            );

        await message.channel.send({ embeds: [errorEmbed] });
    },
    async helpMessage(message) {
        let embed = new Discord.MessageEmbed()
            .setTitle('`q!racelb` HELP')
            .setDescription('BTD6 Race leaderboard loader')
            .addField(
                'Examples',
                '`q!lb 1 50` - shows lb from 1st place to 50th place\n' +
                    `\`q!lb ${id}\` - shows lb for given race ID. For list of race IDs see <#846647839312445451> in [this server](${discord})\n` +
                    `\`q!lb u#tsp\` - shows user placement`
            )
            .setFooter(
                'this is what everyone outside top 100 sees the leaderboard as (updated every 15 mins), if you are in t100 the lb you see is more accurate'
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
    milliseconds = milliseconds < 10 ? '0' + milliseconds : milliseconds;
    return minutes + ':' + seconds + '.' + milliseconds;
}
function formatPersan(score, maxLength, i) {
    let time = 1000000000 - score.score;

    time = parsetime(time);
    let md = score.metadata.split(',');

    let username;
    let timestamp = formatTimestamp(md[11]);

    if (md[0]) username = md[0];
    else username = '???';

    if (time.length == 8) time += ' ';
    let row = '';

    row += addSpaces(i + 1, 2) + ' ';
    row += addSpaces(username, maxLength);
    row += ' ';
    row += time;
    if (timestamp) {
        row += ' ';
        row += timestamp;
    }
    row += '\n';
    return row;
}
function formatTimestamp(timestamp) {
    try {
        timestamp = parseInt(timestamp);
        let s = new Date(timestamp).toGMTString();
        let monthDay = s.substring(5, 11);
        let hms = s.substring(17, 29);
        if (monthDay.includes('id')) return '???';
        return monthDay + ' ' + hms;
    } catch {
        return undefined;
    }
}
function formatMedals(md) {
    let res = [];
    if (md.length < 11) {
        res = [
            `${getEmojiFromId(raceEmojis.BlackDiamond)} : ${md[2]}`,
            `${getEmojiFromId(raceEmojis.RedDiamond)} : ${md[3]}`,
            `${getEmojiFromId(raceEmojis.Diamond)} : ${md[4]}`,
            `${getEmojiFromId(raceEmojis.DoubleGold)} : ${md[5]}`,
            `${getEmojiFromId(raceEmojis.GoldSilver)} : ${md[6]}`,
            `${getEmojiFromId(raceEmojis.DoubleSilver)} : ${md[7]}`,
            `${getEmojiFromId(raceEmojis.Silver)} : ${md[8]}`,
            `${getEmojiFromId(raceEmojis.Bronze)} : ${md[9]}`,
        ];
    } else {
        res = [
            `${getEmojiFromId(raceEmojis.BlackDiamond)} : ${md[2]}`,
            `${getEmojiFromId(raceEmojis.RedDiamond)} : ${md[3]}`,
            `${getEmojiFromId(raceEmojis.Diamond)} : ${md[4]}`,
            `${getEmojiFromId(raceEmojis.GoldDiamond)} : ${md[5]}`,
            `${getEmojiFromId(raceEmojis.DoubleGold)} : ${md[6]}`,
            `${getEmojiFromId(raceEmojis.GoldSilver)} : ${md[7]}`,
            `${getEmojiFromId(raceEmojis.DoubleSilver)} : ${md[8]}`,
            `${getEmojiFromId(raceEmojis.Silver)} : ${md[9]}`,
            `${getEmojiFromId(raceEmojis.Bronze)} : ${md[10].replace(
                ';timestamp',
                ''
            )}`,
        ];
    }
    return res.join(' | ');
}
function getEmojiFromId(id) {
    let guild = client.guilds.cache.get('543957081183617024');
    let emoji = guild.emojis.cache.get(id);
    return emoji;
}
function getLB(start, end, scores) {
    let output = '';
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
        let row = formatPersan(scores[i], maxLength, i);
        output += row;
    }
    return output;
}
