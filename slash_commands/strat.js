const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('strat').setDescription('Strat for being good at BTD6');

async function execute(interaction) {
    return await interaction.reply({
        content:
            "Send faster, pop more Bloons, end more rounds, don't die"
    });
}

module.exports = {
    data: builder,
    execute
};
