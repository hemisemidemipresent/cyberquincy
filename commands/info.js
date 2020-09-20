const { cyber } = require('../jsons/colours.json');
module.exports = {
    name: 'info',
    description: 'shows info',
    aliases: ['i'],
    execute(message) {
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
            .setURL('https://discord.gg/VMX5hZA')
            .setDescription(
                `Cyber Quincy is battling ${client.guilds.cache.size} waves of bloons and training ${client.users.cache.size} monkeys`
            )
            .addField('ping:', `Response time: ${responseTime}ms`, true)

            .addField('time since last restart:', `${uptime}`, true)
            .addField('XP gain enabled?', xpEnabled)
            .addField(
                'more data',
                '[full bot statistics](https://statcord.com/bot/591922988832653313)',
                true
            )
            .addField(
                'discord server, join for updates (happens pretty often)',
                'https://discord.gg/VMX5hZA',
                true
            )
            .setFooter('thank you for using it! Please share!');
        message.channel.send(infoEmbed);
    },
};
