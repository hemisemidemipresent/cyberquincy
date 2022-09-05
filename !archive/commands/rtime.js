const roundlength = require('../jsons/roundlength.json');

const { red, palered, grey, green } = require('../jsons/colours.json');

const RoundParser = require('../parser/round-parser.js');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const TimeParser = require('../parser/time-parser');
const AnyOrderParser = require('../parser/any-order-parser');
module.exports = {
    name: 'rtime',
    aliases: ['racetime', 'rt', 'racet'],
    async execute(message, args) {
        if (args[0] == 'help' || !args) return await helpMessage(message);
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new RoundParser(),
                new RoundParser(),
                new OptionalParser(new ModeParser('ABR'), 'chimps'),
                new TimeParser()
            )
        );
        if (parsed.hasErrors()) {
            return await errorMessage(message, parsed.parsingErrors);
        }
        let time = parsed.time;
        let ftime = formatTime(time);

        let mode = parsed.mode;
        let lengths = roundlength[mode];
        // start, end round
        parsed.rounds.sort();
        let start = parsed.rounds[0];
        let end = parsed.rounds[1];

        let longest = findLongest(start, end, lengths);
        let sendTime = (longest - start) * 0.2 + lengths[longest - 1] + 0.0167 - 0.2;
        let finalStr = formatTime(time + sendTime);
        let sendStr = formatTime(time - sendTime);
        let str =
            `It takes **${
                Math.round((end - start) * 0.2 * 100) / 100
            }s** to send **r${start}** - **r${end}**, ` +
            `and r${longest} lasts **${formatTime(lengths[longest - 1])}**\n\n` +
            `If you fullsended at \`${ftime}\`, you will get a time of **\`${finalStr}\`**\n`;
        if (time - sendTime < 0) {
            str += `You **can't** get a time of \`${ftime}\``;
        } else {
            str += `If you want to get a time of \`${ftime}\`, you will have to fullsend at \`${sendStr}\``;
        }

        let embed = new Discord.EmbedBuilder()
            .setTitle(`If you fullsended from **r${start}** to **r${end}**:`)
            .setDescription(str)
            .setColor(green);
        return await message.channel.send({ embeds: [embed] });
    }
};

async function helpMessage(message) {
    let embed = new Discord.EmbedBuilder()
        .setTitle('q!rtime help')
        .setDescription(
            '`q!rtime <start round> <end round> <time> [mode]`\ntime must be of format `mm:ss`, `hh:mm:ss`, `mm:ss.xxx`, `hh:mm:ss.xxx`\nWhat this shows is:\n1. If you starting sending `startround` to `endround` at `time`, what time you will get\n2. If you want to get `time`, at what time should you start sending `start` to `end`'
        )
        .addFields([
            {
                name: 'examples',
                value: ' • q!rtime 40 49 0:25\n • q!rtime 40 49 25\n • q!rtime 40 49 0:25 abr'
            }
        ])
        .setColor(grey);
    return await message.channel.send({ embeds: [embed] });
}
async function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.EmbedBuilder()
        .setTitle('ERROR')
        .setDescription(
            '`q!rtime <start round> <end round> <time> [mode]`\ntime must be of format `mm:ss`, `hh:mm:ss`, `mm:ss.xxx`, `hh:mm:ss.xxx`\nWhat this shows is:\n1. If you starting sending `startround` to `endround` at `time`, what time you will get\n2. If you want to get `time`, at what time should you start sending `start` to `end`'
        )
        .addFields([
            { name: 'Likely Cause(s)', value: parsingErrors.map((msg) => ` • ${msg}`).join('\n') }
        ])
        .setColor(red);

    return await message.channel.send({ embeds: [errorEmbed] });
}
function parseTime(hms) {
    console.log(hms);
    if (!isNaN(hms)) return parseFloat(hms);
    var a = hms.split(':'); // split it at the colons
    let h = 0;
    let m = 0;
    let s = 0;
    if (a.length == 2) {
        m = a[0];
        s = a[1];
    } else {
        h = a[0];
        m = a[1];
        s = a[2];
    }
    // minutes are worth 60 seconds. Hours are worth 60 minutes.
    var seconds = h * 3600 + m * 60 + parseFloat(s) * 1;
    if (isNaN(seconds)) return undefined;
    else return parseFloat(seconds);
}
function formatTime(s) {
    return new Date(s * 1000).toISOString().substring(14, 23);
}
function parsetime(s) {
    let seconds = Math.floor(s % 60);
    let minutes = Math.floor((s / 60) % 60);

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    milliseconds = milliseconds < 100 ? '0' + milliseconds : milliseconds;
    return minutes + ':' + seconds + '.' + milliseconds;
}
function findLongest(startRound, endRound, lengths) {
    let longestRound = 0;
    let longestLength = 0;
    let j = 0;
    for (i = startRound; i <= endRound; i++) {
        if (longestLength < lengths[i] + j * 0.2) {
            longestLength = lengths[i] + j * 0.2;
            longestRound = i;
        }
        j++;
    }
    return longestRound;
}
