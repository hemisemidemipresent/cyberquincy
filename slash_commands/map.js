const { SlashCommandBuilder } = require('discord.js');
const { cyber } = require('../jsons/colors.json');
const map = require('../jsons/map.json');
const { discord } = require('../aliases/misc.json');
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
    let m = map[name];
    let thum = m.thu;
    if (!thum)
        thum =
            'https://vignette.wikia.nocookie.net/b__/images/0/0c/QuincyCyberPortraitLvl20.png/revision/latest/scale-to-width-down/179?cb=20190612022025&path-prefix=bloons';

    const mapEmbed = new Discord.EmbedBuilder()
        .setTitle('Map info')
        .setDescription(`Here is your info for ${name}`)
        .setThumbnail(`${thum}`)
        .addFields([
            { name: 'Map length(RBS)', value: `${m.lenStr}`, inline: true },
            { name: 'Object count:', value: `${m.obj}`, inline: true },
            { name: 'Total $ to clear out all the objects', value: `$${m.Cos}`, inline: true },
            { name: 'Version added:', value: `${m.ver}`, inline: true },
            { name: 'Water body percentage/Has water?', value: `${m['wa%']}`, inline: true },
            { name: 'Entrances/Exits', value: `${m.e}`, inline: true },
            { name: 'Bug reporting', value: `report [here](${discord})`, inline: true }
            //'Line of sight obstructions', `${m.los}`, true)
        ])

        .setColor(cyber);
    return await interaction.reply({ embeds: [mapEmbed] });
}

async function onAutocomplete(interaction) {
    const hoistedOptions = interaction.options._hoistedOptions; // array of the previous thing, each for each autocomplete field
    const map_name_partial = hoistedOptions.find((option) => option.name == 'map_name'); // { name: 'option_name', type: 'STRING', value: '<value the user put in>', focused: true }
    const value = map_name_partial.value;

    let fs = FuzzySet(Maps.allMaps());
    let values = fs.get(value, null, 0.2);
    responseArr = [];
    if (!values)
        responseArr = Aliases.allMaps()
            .slice(0, 25) // discord only allows like 25 options at a time
            .map((map) => {
                return { name: map, value: map };
            });
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
