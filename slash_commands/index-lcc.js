const MapParser = require('../parser/map-parser.js');
<<<<<<< HEAD
const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const gHelper = require('../helpers/general.js');

const MIN_ROW = 1;
const MAX_ROW = 100;
const COLS = {
    MAP: 'B',
    COST: 'D',
    VERSION: 'E',
    DATE: 'F',
    PERSON: 'G',
    LINK: 'I',
    CURRENT: 'J'
};

const { paleyellow } = require('../jsons/colors.json');
=======

const gHelper = require('../helpers/general.js');

const { red, paleyellow } = require('../jsons/colors.json');
>>>>>>> afbdfaf2bba9e4dfaea6cdfb8939cc5399e6a866

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
<<<<<<< HEAD
    } else {
        let challengeEmbed = await lcc(parsed.map);
        return await interaction.reply({ embeds: [challengeEmbed] });
    }
}

async function lcc(btd6_map) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'lcc');

    // Load the column containing the different maps
    await sheet.loadCells(`${COLS.MAP}${MIN_ROW}:${COLS.MAP}${MAX_ROW}`); // loads all possible cells with map

    // The row where the queried map is found
    let entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= MAX_ROW; row++) {
        let mapCandidate = sheet.getCellByA1(`${COLS.MAP}${row}`).value;
        // input is "in_the_loop" but needs to be compared to "In The Loop"
        if (mapCandidate && mapCandidate.toLowerCase().replace(/ /g, '_') === btd6_map) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw `Something has gone horribly wrong; ${btd6_map} passed parsing validation but can't be found in the LCC spreadsheet`;
    }

    // Load the row where the map was found
    await sheet.loadCells(`${COLS.MAP}${entryRow}:${COLS.CURRENT}${entryRow}`);

    // Assign each value to be discord-embedded in a simple default way
    values = {};
    for (key in COLS) {
        values[key] = sheet.getCellByA1(`${COLS[key]}${entryRow}`).value;
    }

    // Special formatting for date (get formattedValue instead)
    dateCell = sheet.getCellByA1(`${COLS.DATE}${entryRow}`);
    values.DATE = dateCell.formattedValue;

    // Special formatting for cost (format like cost)
    values.COST = gHelper.numberAsCost(values.COST);

    // Special handling for link (use hyperlink to cleverly embed in discord)
    linkCell = sheet.getCellByA1(`${COLS.LINK}${entryRow}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    // Special handling for current
    // (heavy checkmark doesn't format, use white heavy checkmark instead)
    if (values.CURRENT === gHelper.HEAVY_CHECK_MARK) {
        values.CURRENT = gHelper.WHITE_HEAVY_CHECK_MARK;
    }

    // Embed and send the message
    let challengeEmbed = new Discord.EmbedBuilder().setTitle(`${values.MAP} LCC Combo`).setColor(paleyellow);

    for (field in values) {
        if (values[field])
            challengeEmbed = challengeEmbed.addFields([
                { name: gHelper.toTitleCase(field), value: values[field].toString(), inline: true }
            ]);
    }
=======
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
>>>>>>> afbdfaf2bba9e4dfaea6cdfb8939cc5399e6a866

    return challengeEmbed;
}

<<<<<<< HEAD
=======
async function fetchlcc(searchParams) {
    let res = await fetch('https://btd6index.win/fetch-lcc?' + searchParams);
    let resJson = await res.json();
    if ('error' in resJson) 
        throw new Error(resJson.error);
    return resJson;
}


>>>>>>> afbdfaf2bba9e4dfaea6cdfb8939cc5399e6a866
module.exports = {
    data: builder,
    execute
};
