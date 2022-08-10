const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('invite').setDescription('Invite Cyber Quincy to your server');

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
