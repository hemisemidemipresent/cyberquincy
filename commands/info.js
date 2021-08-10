const { cyber } = require('../jsons/colours.json');
const { discord } = require('../aliases/misc.json');
const { dyno } = require('../1/config.json');
module.exports = {
    name: 'info',
    description: 'shows info',
    aliases: ['i'],
    execute(message, args) {
        /*if (args[0] == 'renmari') {
            let res = '';
            client.guilds.cache.map((g) => (res += g.name + '\n'));
            let arr = res.match(/.{1,3999}/g);
            for (let i = 0; i < arr.length; i++) {
                message.channel.send(arr[i]);
            }
        }*/
        const responseTime = Math.round(Date.now() - message.createdTimestamp);
        let totalSeconds = client.uptime / 1000;
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        const minutes = Math.floor(totalSeconds / 60);
        const uptime = `${days} days, ${hours} hours, and ${minutes} minutes`;

        const infoEmbed = new Discord.MessageEmbed()
            .setColor(cyber)
            .setTitle('access help here')
            .setURL(`${discord}`)
            .setDescription(
                `Cyber Quincy is battling ${client.guilds.cache.size} waves of bloons`
            )
            .addField('ping:', `Response time: ${responseTime}ms`, true)

            .addField('time since last restart:', `${uptime}`, true)
            .addField(
                'more data',
                '[full bot statistics](https://statcord.com/bot/591922988832653313) - note users are inaccurate and servers might be inaccurate',
                true
            )
            .addField(
                'discord server, join for updates (happens pretty often)',
                `${discord}`,
                true
            )
            .addField('using', dyno)
            .setFooter('thank you for using it! Please share!');
        message.channel.send(infoEmbed);
    },
};
