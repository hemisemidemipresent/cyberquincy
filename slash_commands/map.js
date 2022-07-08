const { SlashCommandBuilder } = require('@discordjs/builders');
const { cyber } = require('../jsons/colours.json');
const map = require('../jsons/map.json');
const { discord } = require('../aliases/misc.json');

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

    const mapEmbed = new Discord.MessageEmbed()
        .setTitle('Map info')
        .setDescription(`Here is your info for ${name}`)
        .setThumbnail(`${thum}`)
        .addField('Map length(RBS)', `${m.lenStr}`, true)
        .addField('Object count:', `${m.obj}`, true)
        .addField('Total $ to clear out all the objects', `$${m.Cos}`, true)
        .addField('Version added:', `${m.ver}`, true)
        .addField('Water body percentage/Has water?', `${m['wa%']}`, true)
        .addField('Entrances/Exits', `${m.e}`, true)
        //.addField('Line of sight obstructions', `${m.los}`, true)
        .addField('Bug reporting', `report [here](${discord})`, true)
        .setColor(cyber);
    return await interaction.reply({ embeds: [mapEmbed] });
}

async function onAutocomplete(interaction) {
    const hoistedOptions = interaction.options._hoistedOptions; // array of the previous thing, each for each autocomplete field
    const map_name_partial = hoistedOptions.find((option) => option.name == 'map_name'); // { name: 'option_name', type: 'STRING', value: '<value the user put in>', focused: true }
    const value = map_name_partial.value;

    fs = FuzzySet(Aliases.allMaps());
    const values = fs.get(value, null, 0.2);
    responseArr = [];
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
