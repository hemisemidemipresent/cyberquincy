const { SlashCommandBuilder } = require('discord.js');

const { cyber } = require('../jsons/colors.json');
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

    let guildCounts = await client.shard.fetchClientValues('guilds.cache.size');
    let guildCount = guildCounts.reduce((acc, guildCount) => acc + guildCount, 0);

    const infoEmbed = new Discord.EmbedBuilder()
        .setColor(cyber)
        .setTitle('access help here')
        .setURL(`${discord}`)
        .setDescription(`Cyber Quincy is battling ${guildCount} waves of bloons`)
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
