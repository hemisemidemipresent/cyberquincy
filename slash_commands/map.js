const { SlashCommandBuilder } = require('discord.js');
const { cyber, red } = require('../jsons/colors.json');
const Maps = require('../helpers/maps');

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
    let name = interaction.options.getString('map_name');

    let searchParams = new URLSearchParams(Object.entries({ map: name }));

    let res = await fetch('https://btd6index.win/fetch-map-info?' + searchParams);
    let mapJson = await res.json();
    // error or empty object
    if ('error' in mapJson || Object.keys(mapJson).length === 0) {
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('Error!')
                    .setDescription(`An error occured while [fetching information](https://btd6index.win/fetch-map-info?${searchParams}) for ${name}`)
                    .setColor(red)
            ]
        });
    }

    let mapEmbed = new Discord.EmbedBuilder()
        .setTitle(`Map information for ${name}`)
        .setDescription(`Here is your info for ${name}`)
        .setColor(cyber)
        .addFields([
            { name: 'Abbreviation', value: mapJson.abbreviation, inline: true },
            { name: 'Map Difficulty', value: mapJson.difficulty, inline: true },
            { name: 'Version added:', value: mapJson.version, inline: true }
        ]);


    // map length
    if (!mapJson.lengthNotes) mapEmbed.addFields([{ name: 'Map length (RBS)', value: `${mapJson.length}`, inline: true }]);
    else {
        mapEmbed.addFields([
            { name: 'Path Length (RBS)', value: `Average: ${mapJson.length}\n\n${mapJson.lengthNotes}` },
        ]);
    }
    mapEmbed.addFields([
        { name: 'Entrances/Exits', value: `${mapJson.numEntrances} entrance(s), ${mapJson.numExits} exit(s)`, inline: true },
        { name: 'Object count', value: `${mapJson.numObjects} objects`, inline: true },
    ]);

    if (mapJson.removalCost) {
        if (!mapJson.removalCostNotes) mapEmbed.addFields([{ name: 'Cost to Remove/Activate All Objects', value: mapJson.removalCost, inline: true }]);
        else mapEmbed.addFields([{ name: 'Object Removal/Activation', value: `Cost: ${mapJson.removalCost}\n\n${mapJson.removalCostNotes}` }]);
    }

    mapEmbed.addFields([
        { name: 'Has water?', value: mapJson.hasWater == 1 ? 'yes' : 'no', inline: true },
        { name: 'Line of sight obstructions', value: mapJson.hasLOS == 1 ? 'yes' : 'no', inline: true }

    ]);

    if (mapJson.miscNotes) mapEmbed.addFields([{ name:'Miscellaneous Notes', value: mapJson.miscNotes }]);

    mapEmbed.setFooter({ text: 'RBS measured on hard mode, so values are different from bloons wiki. Data taken from btd6index.win' });


    return await interaction.reply({ embeds: [mapEmbed] });
}

async function onAutocomplete(interaction) {
    const hoistedOptions = interaction.options._hoistedOptions; // array of the previous thing, each for each autocomplete field
    const map_name_partial = hoistedOptions.find((option) => option.name == 'map_name'); // { name: 'option_name', type: 'STRING', value: '<value the user put in>', focused: true }
    const value = map_name_partial.value;


    let allMaps = Maps.allMaps().map(mapName => Aliases.toIndexNormalForm(mapName));

    let fs = FuzzySet(allMaps);
    let values = fs.get(value, null, 0.2);
    responseArr = [];
    if (!values)
        responseArr = allMaps
            .slice(0, 25) // discord only allows 25 options at a time
            .map((map) => {
                return { name: map, value: map }; // cant inline because we are returning an object :(
            });
    else
        values.forEach((value, index) => {
            if (index < 25) responseArr.push({ name: value[1], value: value[1] });
        });
    await interaction.respond(responseArr);
}

module.exports = {
    data: builder,
    execute,
    onAutocomplete
};
