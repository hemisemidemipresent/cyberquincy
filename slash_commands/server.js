const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder()
    .setName('server')
    .setDescription('Invite to Cyber Quincy server');

async function execute(interaction) {
    return await interaction.reply({
        content:
            'Join this discord server to get notifications on bot updates, downtime, report bugs and to suggest features: https://discord.gg/AtCA2ZMNng'
    });
}

module.exports = {
    data: builder,
    execute
};
