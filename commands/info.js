const { colour } = require('../shh/config.json');
const Discord = require('discord.js');
module.exports = {
    name: 'info',
    description: 'shows info',
    aliases: ['i'],
    usage: '<path1> <path2> <path3>',
    execute(message, args, client) {
        const apiPing = Math.round(message.client.ping);
        const responseTime = Math.round(Date.now() - message.createdTimestamp);
        let totalSeconds = client.uptime / 1000;
        let days = Math.floor(totalSeconds / 86400);
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let uptime = `${days} days, ${hours} hours, and ${minutes} minutes`;

        const infoEmbed = new Discord.RichEmbed()
            .setColor(colour)
            .setTitle('access help here')
            .setURL('https://discord.gg/8agRm6c')
            .setDescription(
                `Cyber Quincy is battling ${client.guilds.cache.size} waves of bloons and training ${client.users.cache.size} monkeys`
            )
            .addField(
                'ping:',
                `API ping ${apiPing}\nResponse time: ${responseTime}ms`,
                true
            )
            .setThumbnail(
                'https://vignette.wikia.nocookie.net/b__/images/d/d3/QuincyCyberPortrait.png/revision/latest?cb=20190612021929&path-prefix=bloons'
            )
            .addField('time since last restart:', `${uptime}`, true)
            .addField(
                'bot invite link',
                'https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=805432400'
            )
            .addField('commands list', 'https://cq.netlify.com', true)
            .addField(
                'support server, join for updates (happens pretty often)',
                'https://discord.gg/8agRm6c',
                true
            )
            .setFooter('thank you for using it! waiting for popularity');
        message.channel.send(infoEmbed);
    },
};
