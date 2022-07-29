const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('vrej').setDescription('vrej');

async function execute(interaction) {
    return await interaction.reply({
        content: 'https://www.youtube.com/watch?v=PWkgMCtbnkM&'
    });
}

module.exports = {
    data: builder,
    execute
};
