const MapParser = require('../parser/map-parser');

const { red, palegreen } = require('../jsons/colors.json');

const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');
const { genCompletionLink } = require('../helpers');

let mapOption = new SlashCommandStringOption().setName('map').setDescription('Map').setRequired(true);

let comboModifierOption = new SlashCommandStringOption()
    .setName('modifier')
    .setDescription('LTC variant for the given map')
    .setRequired(false)
    .addChoices({ name: 'Cheapest', value: 'cheapest' }, { name: 'OG', value: 'og' });

builder = new SlashCommandBuilder()
    .setName('ltc')
    .setDescription('Search and Browse Completed LTC Index Combos')
    .addStringOption(mapOption)
    .addStringOption(comboModifierOption);

async function execute(interaction) {
    const mapArg = interaction.options.getString('map');
    const canonicalMap = Aliases.getCanonicalForm(mapArg);

    const parsed = CommandParser.parse([canonicalMap], new MapParser());

    await interaction.deferReply();

    if (parsed.hasErrors()) {
        return await interaction.reply('Map provided not valid');
    } else {
        const modifier = interaction.options.getString('modifier');
        let challengeEmbed = await ltc(Aliases.toIndexNormalForm(canonicalMap), modifier);
        return await interaction.reply({ embeds: [challengeEmbed] });
    }
}

async function ltc(map, modifier) {

    let searchParams = {
        map: map,
        count: 100,
        pending: 0
    };
    if (modifier) searchParams.completiontype = modifier;

    searchParams = new URLSearchParams(searchParams);
    const { results } = await fetchltc(searchParams);
    const result = results[0];

    if (!result) return new Discord.EmbedBuilder().setTitle('Error!').setDescription(`No LTC found for ${map}`).setColor(red);

    const towerset = JSON.parse(result.towerset);
    const upgradeset = JSON.parse(result.upgradeset);


    const challengeEmbed = new Discord.EmbedBuilder();

    challengeEmbed.setTitle(`${modifier ?? ''} ${map} LTC combo`);
    challengeEmbed.setColor(palegreen);

    for (let i = 0; i < towerset.length; i++) {
        challengeEmbed.addFields([{ name: `Tower ${i+1}`, value: `${towerset[i]} (${upgradeset[i]})`, inline: true }]);
    }

    let link = genCompletionLink(result);

    challengeEmbed.addFields([
        { name: 'Map', value: result.map, inline: true },
        { name: 'Version', value: result.version, inline: true },
        { name: 'Date', value: result.date, inline: true },
        { name: 'Person', value: result.person, inline: true },
        { name: 'Link', value: link, inline: true }
    ]);

    return challengeEmbed;

}

async function fetchltc(searchParams) {
    let res = await fetch('https://btd6index.win/fetch-ltc?' + searchParams);
    let resJson = await res.json();
    if ('error' in resJson)
        throw new Error(resJson.error);
    return resJson;
}

module.exports = {
    data: builder,
    execute
};
