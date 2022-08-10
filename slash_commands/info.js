const { SlashCommandBuilder } = require('discord.js');

const { cyber } = require('../jsons/colours.json');
const { discord } = require('../aliases/misc.json');

builder = new SlashCommandBuilder().setName('info').setDescription('Information and Stats about this bot');

async function execute(interaction) {
    const responseTime = Math.round(Date.now() - interaction.createdTimestamp);
    let totalSeconds = client.uptime / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const uptime = `${days} days, ${hours} hours, and ${minutes} minutes`;

    const infoEmbed = new Discord.EmbedBuilder()
        .setColor(cyber)
        .setTitle('access help here')
        .setURL(`${discord}`)
        .setDescription(`Cyber Quincy is battling ${client.guilds.cache.size} waves of bloons`)
        .addFields([
            { name: 'ping:', value: `Response time: ${responseTime}ms`, inline: true },
            { name: 'time since last restart:', value: `${uptime}`, inline: true },
            {
                name: 'more data',
                value: '[full bot statistics](https://statcord.com/bot/591922988832653313) - note users are inaccurate and servers might be inaccurate',
                inline: true
            },
            { name: 'discord server, join for updates (happens pretty often)', value: `${discord}`, inline: true }
        ])
        .setFooter({ text: 'thank you for using it! Please share!' });
    return await interaction.reply({
        embeds: [infoEmbed]
    });
}

module.exports = {
    data: builder,
    execute
};
