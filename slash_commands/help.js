const { discord } = require('../aliases/misc.json');

const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('help').setDescription('The help command for the bot');

async function execute(interaction) {
    let embed = new Discord.EmbedBuilder()
        .setTitle('Need help?')
        .setDescription(`discord server: ${discord} to stay up-to-date`)
        .addFields([
            {
                name: 'Invite the bot',
                value: '[invite link](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617)'
            },
            {
                name: 'Upvote the bot',
                value: '[top.gg](https://top.gg/bot/591922988832653313)\n[discordbotlist](https://discordbotlist.com/bots/cyber-quincy)'
            },
            {
                name: 'List of commands',
                value: 'This bot uses slash commands, scroll through the slash commands to find any command you want!'
            }
        ]);
    return await interaction.reply({
        embeds: [embed]
    });
}

module.exports = {
    data: builder,
    execute
};
