const { SlashCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandOptionChoice } = require('discord.js');

builder = new SlashCommandBuilder()
    .setName('map')
    .setDescription('Information about maps')
    .addStringOption((option) =>
        option
            .setName('map_name')
            .setDescription('The map you are finding information for')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption((option) =>
        option
            .setName('map_name2')
            .setDescription('The map you are finding information for')
            .setRequired(true)
            .setAutocomplete(true)
    );

async function execute(interaction) {}

async function onAutocomplete(interaction) {
    const hoistedOptions = interaction.options._hoistedOptions; // array of the previous thing, each for each autocomplete field
    const map_name_partial = hoistedOptions.find((option) => option.name == 'map_name'); // { name: 'option_name', type: 'STRING', value: '<value the user put in>', focused: true }
    const value = map_name_partial.value;

    /*
    // Example:
    interaction.respond([
        {
            name: 'Option 1',
            value: 'option1'
        }
    ]);
    */
}

module.exports = {
    data: builder,
    execute,
    onAutocomplete
};
