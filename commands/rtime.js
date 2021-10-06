const lengths = require('../jsons/roundlength.json');

const { red, palered, grey } = require('../jsons/colours.json');

const RoundParser = require('../parser/round-parser');
const AnythingParser = require('../parser/anything-parser');
module.exports = {
    name: 'rtime',
    aliases: ['racetime', 'rt', 'racet'],
    async execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new RoundParser(),
            new RoundParser(),
            new AnythingParser()
        );
        if (parsed.hasErrors()) {
            return await errorMessage(message, parsed.parsingErrors);
        }
        parsed.rounds.sort();
        let time = parseTime(parsed.anything);
        if (!time) await errorMessage(message, ['invalid time (probably)']);

        let ftime = formatTime(time);
        let start = parsed.rounds[0];
        let end = parsed.rounds[1];
        let longest = findLongest(start, end);
        let sendTime = (end - start) * 0.2 + lengths[longest - 1];
        console.log(time, sendTime);
        let finalStr = formatTime(time + sendTime);
        let sendStr = formatTime(time - sendTime);
        let str =
            `It takes **${
                (end - start) * 0.2
            }s** to send **r${start}** - **r${end}**, ` +
            `and r${longest} lasts **${lengths[longest - 1]}s**\n\n` +
            `If you fullsended at \`${ftime}\`, you will get a time of \`${finalStr}\`\n`;
        if (time - sendTime < 0) {
            str += `You **can't** get a time of \`${ftime}\``;
        } else {
            str += `If you want to get a time of \`${ftime}\`, you will have to fullsend at \`${sendStr}\``;
        }

        let embed = new Discord.MessageEmbed()
            .setTitle(`If you fullsended from **r${start}** to **r${end}**:`)
            .setDescription(str)
            .setColor(palered);
        return await message.channel.send({ embeds: [embed] });
    },
};

async function helpMessage(message) {
    let embed = new Discord.MessageEmbed()
        .setTitle('q!rtime help')
        .setDescription(
            '`q!rtime <start round> <end round> <time>`\ntime must be of format `mm:ss`, `hh:mm:ss`, `mm:ss.xxx`, `hh:mm:ss.xxx`'
        )
        .setColor(grey);
    return await message.channel.send({ embeds: [embed] });
}
async function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .setDescription(
            '`q!rtime <start round> <end round> <time>`\ntime must be of format `mm:ss`, `hh:mm:ss`, `mm:ss.xxx`, `hh:mm:ss.xxx`'
        )
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .setColor(red);

    return await message.channel.send({ embeds: [errorEmbed] });
}
function parseTime(hms) {
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
function findLongest(startRound, endRound) {
    let longestRound = 0;
    let longestLength = 0;
    let j = 0;
    for (i = startRound; i <= endRound; i++) {
        if (longestLength < lengths[i] + j * 0.2) {
            longestLength = lengths[i] + j * 0.2;
            longestRound = i + 1;
        }
        j++;
    }
    return longestRound;
}
