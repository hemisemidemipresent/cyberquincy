const { green } = require('../jsons/colours.json');
let bossStart = {
    day: 6,
    hour: 8,
    minute: 0,
    second: 0,
};
let bossEnd = {
    day: 4,
    hour: 8,
    minute: 0,
    second: 0,
};
let raceStart = {
    day: 5,
    hour: 8,
    minute: 0,
    second: 0,
};
let raceEnd = {
    day: 1,
    hour: 3,
    minute: 30,
    second: 0,
};
let odysseyStart = {
    day: 4,
    hour: 8,
    minute: 0,
    second: 0,
};
let odysseyEnd = {
    day: 3,
    hour: 3,
    minute: 30,
    second: 0,
};
module.exports = {
    name: 'timer',
    aliases: ['time', 'events', 'when', '⌛'],
    async execute(message) {
        let d = new Date();
        let date = {
            day: d.getDay(),
            hour: d.getHours(),
            minute: d.getMinutes(),
            second: d.getSeconds(),
        };
        const embed = new Discord.MessageEmbed()
            .setTitle('Event timers ⌛')
            .addField(
                'Race event',
                `_New one starts_ in ${getDiff(
                    date,
                    raceStart
                )}\n_Ends_ in ${getDiff(date, raceEnd)}`
            )
            .addField(
                'Odyssey event',
                `_New one starts_ in ${getDiff(
                    date,
                    odysseyStart
                )}\n_Ends_ in ${getDiff(date, odysseyEnd)}`
            )
            .addField(
                'Boss event',
                `_New one starts_ in ${getDiff(
                    date,
                    bossStart
                )}\n_Ends_ in ${getDiff(date, bossEnd)}`
            )

            .setColor(green);
        return await message.channel.send({ embeds: [embed] });
    },
};
function getDiff(date1, date2) {
    let diff = 0;
    let daysDiff = date2.day - date1.day;

    if (daysDiff < 0) {
        daysDiff += 7;
    }
    diff += daysDiff * 86400;

    diff += (date2.hour - date1.hour) * 3600;
    diff += (date2.minute - date1.minute) * 60;
    diff += date2.second - date1.second;

    return parseTime(diff);
}
function parseTime(time) {
    const days = Math.floor(time / 86400);
    time -= days * 86400;
    const hours = Math.floor(time / 3600);
    time -= hours * 3600;
    const minutes = Math.floor(time / 60);
    time -= minutes * 60;
    return `${days}d ${hours}h ${minutes}m and ${parseInt(time)}s`;
}
function convertTZ(date, tzString) {
    return new Date(
        (typeof date === 'string' ? new Date(date) : date).toLocaleString(
            'en-US',
            { timeZone: tzString }
        )
    )
        .toString()
        .substr(0, 24);
}
