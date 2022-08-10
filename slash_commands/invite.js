const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('invite').setDescription('Invite the application to your server');

async function execute(interaction) {
    return await interaction.reply({
        content:
            'https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617'
    });
}

module.exports = {
    data: builder,
    execute
};
