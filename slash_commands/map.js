const { SlashCommandBuilder } = require('@discordjs/builders');

const { allMapNames } = require('../helpers/maps')

const FuzzySet = require('fuzzyset.js');

builder = new SlashCommandBuilder()
    .setName('map')
    .setDescription('Information and Stats about BTD6 maps')
    .addStringOption((option) =>
        option
            .setName('map_name')
            .setDescription('The name of the map whose data you want')
            .setAutocomplete(true)
            .setRequired(true)
    );

async function execute(interaction) {
    return await interaction.reply('under construction');
}
async function onAutocomplete(interaction) {
    const hoistedOptions = interaction.options._hoistedOptions; // array of the previous thing, each for each autocomplete field
    const map_name_partial = hoistedOptions.find((option) => option.name == 'map_name'); // { name: 'option_name', type: 'STRING', value: '<value the user put in>', focused: true }
    const value = map_name_partial.value;

    fs = FuzzySet(allMapNames());
    const values = fs.get(value);

    console.log(values);

    responseArr = [];
    values.forEach((value, index) => {
        if (index < 25) {
            responseArr.push({ name: value[1], value: value[1] });
        }
    });
    await interaction.respond(responseArr);
}
module.exports = {
    data: builder,
    execute,
    onAutocomplete
};
