const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('femdom').setDescription('Femdom copypasta');

async function execute(interaction) {
    return await interaction.reply({
        content:
            "if I may offer input, ezili seems restrained rather than an actual bottom, if you get her to open up then she will absolutely destroy you\ngwen strikes me as the type to act tough on the field but enjoy cuddles and rainbows and stuff"
    });
}

module.exports = {
    data: builder,
    execute
};
