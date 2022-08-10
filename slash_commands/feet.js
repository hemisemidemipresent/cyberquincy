const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('feet').setDescription('Ace micro with foot');

async function execute(interaction) {
    return await interaction.reply({
        content:
            "https://youtu.be/vmjeHHm1pD4"
    });
}

module.exports = {
    data: builder,
    execute
};
