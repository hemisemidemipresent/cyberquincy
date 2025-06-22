const { MessageFlags, SlashCommandBuilder } = require('discord.js');

const FuzzySet = require('fuzzyset.js');

const { discord, footer } = require('../aliases/misc.json');
const { cyber } = require('../jsons/colors.json');
const { getRelicBloonology } = require('../helpers/bloonology.js');

let cachedRelics = {};

builder = new SlashCommandBuilder()
    .setName('relic')
    .setDescription('Information and Stats about Contested Territory relics')
    .addStringOption((option) =>
        option
            .setName('relic_name')
            .setDescription('The name of the relic whose data you want')
            .setAutocomplete(true)
            .setRequired(true)
    );

async function validateInput(interaction) {
    if (Object.keys(cachedRelics).length === 0) cachedRelics = await getRelicBloonology();

    let relicName = interaction.options.getString('relic_name');
    if (!cachedRelics[relicName])
        return "The specified relic doesn't exist!\nPlease use the autocomplete feature for the exact wording";
}

async function execute(interaction) {
    const validationFailure = await validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            flags: MessageFlags.Ephemeral
        });

    const relic_name = interaction.options.getString('relic_name');

    let embed = new Discord.EmbedBuilder()
        .setTitle(relic_name)
        .setDescription(cachedRelics[relic_name])
        .setColor(cyber)
        .addFields([{ name: 'If this is wrong', value: `report [here](${discord})` }])
        .setFooter({ text: footer });

    return await interaction.reply({ embeds: [embed] });
}
async function onAutocomplete(interaction) {
    if (Object.keys(cachedRelics).length === 0) cachedRelics = await getRelicBloonology();

    const hoistedOptions = interaction.options._hoistedOptions; // array of the previous thing, each for each autocomplete field
    const relic_name_partial = hoistedOptions.find((option) => option.name == 'relic_name'); // { name: 'option_name', type: 'STRING', value: '<value the user put in>', focused: true }
    const value = relic_name_partial.value;
    const relicNames = Object.keys(cachedRelics);

    let fs = FuzzySet(relicNames);
    const values = fs.get(value, null, 0.2);
    responseArr = [];
    values?.forEach((value, i) => {
        if (i < 25) responseArr.push({ name: value[1], value: value[1] });
    });

    if (responseArr.length === 0) {
        relicNames.forEach((relicName, i) => {
            if (i < 25) responseArr.push({ name: relicName, value: relicName });
        });
    }
    await interaction.respond(responseArr);
}

module.exports = {
    data: builder,
    execute,
    onAutocomplete
};
// background info: there are 2 newlines present in the string: \n and \r. \n is preferred
// function cleanDescription(desc) {
//     return desc
//         .toString()
//         .replace(/\n/g, '') // removes all newlines \n
//         .replace(/\r \t/g, '\n') // removes all \r + tab
//         .replace(/ \t-/g, '-    ') // removes remaining tabs
//         .replace(/\r/g, '\n'); // switches back all remaining \r with \n
// }
