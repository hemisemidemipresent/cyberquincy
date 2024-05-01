const MapParser = require('../parser/map-parser.js');

const gHelper = require('../helpers/general.js');

const { red, paleyellow } = require('../jsons/colors.json');

const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

let mapOption = new SlashCommandStringOption().setName('map').setDescription('Map').setRequired(true);

builder = new SlashCommandBuilder()
    .setName('lcc')
    .setDescription('Search and Browse Completed LCC Index Combos')
    .addStringOption(mapOption);

async function execute(interaction) {
    const mapArg = interaction.options.getString('map');
    const canonicalMap = Aliases.getCanonicalForm(mapArg);

    const parsed = CommandParser.parse([canonicalMap], new MapParser());

    await interaction.deferReply();

    if (parsed.hasErrors()) {
        return await interaction.reply('Map provided not valid');
    }

    let challengeEmbed = await lcc(Aliases.toIndexNormalForm(parsed.map));
    return await interaction.reply({ embeds: [challengeEmbed] });
    
}

async function lcc(map) {

    const searchParams = new URLSearchParams({ map, count: 100, pending: 0 });

    let { results } = await fetchlcc(searchParams);
    
    const result = results[0];

    if (!result) return new Discord.EmbedBuilder().setTitle('Error!').setDescription(`No LCC found for ${map}`).setColor(red);

    let challengeEmbed = new Discord.EmbedBuilder().setTitle(`${map} LCC Combo`).setColor(paleyellow);

    let link = 'none';
    if (result.link) link = `[Link](${result.link})`;

    challengeEmbed.addFields([
        { name: 'Map', value: result.map, inline: true },
        { name: 'Cost', value: gHelper.numberAsCost(result.money), inline: true },
        { name: 'Version', value: result.version, inline: true },
        { name: 'Date', value: result.date, inline: true },
        { name: 'Person', value: result.person, inline: true },
        { name: 'Link', value: link, inline: true }
    ]);

    return challengeEmbed;
}

async function fetchlcc(searchParams) {
    let res = await fetch('https://btd6index.win/fetch-lcc?' + searchParams);
    let resJson = await res.json();
    if ('error' in resJson) 
        throw new Error(resJson.error);
    return resJson;
}


module.exports = {
    data: builder,
    execute
};
