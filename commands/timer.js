const Discord = require('discord.js');
const { green } = require('../jsons/colours.json');
module.exports = {
    name: 'timer',
    aliases: ['time', 'events', 'when', '⌛'],
    execute(message) {
        let now = Date.now() / 1000;
        let arr = [now - 444600, now - 116200, now - 29800];
        let resultArr = [];
        arr.forEach((item) => {
            resultArr.push(parseTime(604800 - (item % 604800)));
        });
        const embed = new Discord.MessageEmbed()
            .setTitle('Event timers ⌛')
            .addField('Time until next odyssey', resultArr[2])
            .addField('Time until next race starts', resultArr[1])
            .addField('Time until race ends', resultArr[0])
            .setColor(green);
        return message.channel.send(embed);
    },
};
function parseTime(time) {
    const days = Math.floor(time / 86400);
    time -= days * 86400;
    const hours = Math.floor(time / 3600);
    time -= hours * 3600;
    const minutes = Math.floor(time / 60);
    time -= minutes * 60;
    return `${days} days, ${hours} hours, ${minutes} minutes, and ${parseInt(
        time
    )} seconds`;
}
