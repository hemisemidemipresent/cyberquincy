const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('vtsg').setDescription('Vengeful True Sun God');

async function execute(interaction) {
    return await interaction.reply({
        content:
            '555 super monkey has the following buffs compared to a TSG (use q!temple):\n• sunblast buffed: +25d\nall other attacks (including subtowers) buffed: ×2d (applied after additive buffs)'
    });
}

module.exports = {
    data: builder,
    execute
};
