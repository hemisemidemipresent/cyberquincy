const MapParser = require('../parser/map-parser');
const GoogleSheetsHelper = require('../helpers/google-sheets');

const gHelper = require('../helpers/general.js');

const MIN_ROW = 1;
const MAX_ROW = 100;

const { palegreen } = require('../jsons/colours.json');

const COLS = {
    ONE: {
        MAP: 'B',
        TOWERS: ['D'],
        UPGRADES: 'F',
        VERSION: 'H',
        DATE: 'I',
        PERSON: 'J',
        LINK: 'L',
        CURRENT: 'M'
    },
    TWO: {
        MAP: 'B',
        TOWERS: ['D', 'F'],
        UPGRADES: 'H',
        VERSION: 'J',
        DATE: 'K',
        PERSON: 'L',
        LINK: 'N',
        CURRENT: 'O'
    },
    THREE: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H'],
        UPGRADES: 'J',
        VERSION: 'L',
        DATE: 'M',
        PERSON: 'N',
        LINK: 'P',
        CURRENT: 'Q'
    },
    FOUR: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H', 'J'],
        UPGRADES: 'L',
        VERSION: 'O',
        DATE: 'P',
        PERSON: 'Q',
        LINK: 'S',
        CURRENT: 'T'
    },
    FIVE: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H', 'J', 'L'],
        UPGRADES: 'N',
        VERSION: 'Q',
        DATE: 'R',
        PERSON: 'S',
        LINK: 'U',
        CURRENT: 'V'
    },
    SIX: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H', 'J', 'L', 'N'],
        UPGRADES: 'P',
        VERSION: 'S',
        DATE: 'T',
        PERSON: 'U',
        LINK: 'W',
        CURRENT: 'X'
    }
};

const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

let mapOption = new SlashCommandStringOption()
    .setName('map')
    .setDescription('Map')
    .setRequired(true);

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

    if (parsed.hasErrors()) {
        return await interaction.reply('Map provided not valid');
    } else {
        const modifier = interaction.options.getString('modifier');
        let challengeEmbed = await ltc(canonicalMap, modifier);
        return await interaction.reply({ embeds: [challengeEmbed] });
    }
}

async function ltc(btd6_map, modifier) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'ltc');

    // Load the column containing the different maps
    await sheet.loadCells(`${COLS['TWO'].MAP}${MIN_ROW}:${COLS['TWO'].MAP}${MAX_ROW}`); // loads all possible cells with map

    // The row where the queried map is found
    var entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= MAX_ROW; row++) {
        var mapCandidate = sheet.getCellByA1(`${COLS['TWO'].MAP}${row}`).value;
        // input is "in_the_loop" but needs to be compared to "In The Loop"
        if (mapCandidate && mapCandidate.toLowerCase().replace(/ /g, '_') === btd6_map) {
            entryRow = row;
            break;
        }
    }

    // Determines correspondence between column letter and data type depending on
    // how many towers it took to complete the LTC run
    colset = getColumnSet(entryRow, sheet);

    // Load the row where the map was found
    await sheet.loadCells(`${colset.MAP}${entryRow}:${colset.CURRENT}${entryRow}`);

    // Values to be included in the LTC embedded message
    values = {};

    if (modifier == 'cheapest') {
        return await getRowAltData(entryRow, 'CHEAPEST', colset);
    } else if (modifier == 'og') {
        return await getRowAltData(entryRow, 'OG', colset);
    } else {
        return await getRowStandardData(entryRow, colset);
    }
}

async function getRowStandardData(entryRow, colset) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'ltc');

    // Towers + Upgrades need some special handling since #towers varies
    if (colset['TOWERS']) {
        const upgrades = sheet
            .getCellByA1(`${colset['UPGRADES']}${entryRow}`)
            .value.split('|')
            .map((u) => u.replace(/^\s+|\s+$/g, ''));

        for (var i = 0; i < colset['TOWERS'].length; i++) {
            values[`Tower ${i + 1}`] =
                sheet.getCellByA1(`**${colset['TOWERS'][i]}${entryRow}**`).value +
                ' (' +
                upgrades[i] +
                ')';
        }
    }

    // Assign each value to be discord-embedded in a simple default way
    for (key in colset) {
        if (key == 'TOWERS' || key == 'UPGRADES') continue; // Handle next
        values[key] = sheet.getCellByA1(`${colset[key]}${entryRow}`).value;
    }

    // Special formatting for date (get formattedValue instead)
    dateCell = sheet.getCellByA1(`${colset.DATE}${entryRow}`);
    values.DATE = dateCell.formattedValue;

    // Special handling for link (use hyperlink to cleverly embed in discord)
    linkCell = sheet.getCellByA1(`${colset.LINK}${entryRow}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    // Special handling for current
    // (heavy checkmark doesn't format, use white heavy checkmark instead)
    if (values.CURRENT === gHelper.HEAVY_CHECK_MARK) {
        values.CURRENT = gHelper.WHITE_HEAVY_CHECK_MARK;
    }

    var challengeEmbed = new Discord.EmbedBuilder()
        .setTitle(`${values.MAP} LTC Combo`)
        .setColor(palegreen);

    for (field in values) {
        challengeEmbed = challengeEmbed.addFields([
            { name: gHelper.toTitleCase(field), value: values[field].toString(), inline: true }
        ]);
    }

    return challengeEmbed;
}

async function getRowAltData(entryRow, qualifier, colset) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'ltc');

    mapCell = sheet.getCellByA1(`${colset.MAP}${entryRow}`);
    notes = parseMapNotes(mapCell.note);

    if (!notes || !notes[qualifier]) {
        return await getRowStandardData(entryRow, colset);
    }

    var challengeEmbed = new Discord.EmbedBuilder()
        .setTitle(`${gHelper.toTitleCase(qualifier)} ${mapCell.value} LTC Combo`)
        .setColor(palegreen)
        .addFields([
            { name: 'Person', value: notes[qualifier].PERSON, inline: true },
            { name: 'Link', value: notes[qualifier].LINK, inline: true }
        ]);

    return challengeEmbed;
}

function parseMapNotes(notes) {
    if (!notes) return {};
    return Object.fromEntries(
        notes
            .trim()
            .split('\n')
            .map((n) => {
                let qualifier, person, bitly;
                [qualifier, person, bitly] = n.split(/[,:]/).map((t) => t.replace(/ /g, ''));

                return [
                    qualifier.toUpperCase(),
                    {
                        PERSON: person,
                        LINK: `[${bitly}](http://${bitly})`
                    }
                ];
            })
    );
}

function getColumnSet(mapRow, sheet) {
    // Looks for "Two|Three|...|Six Towers" in the closest above header cell
    headerRegex = new RegExp(`(${Object.keys(COLS).join('|').replace('+', '\\+')}) Towers?`, 'i');

    candidateHeaderRow = mapRow - 1;
    while (candidateHeaderRow > 0) {
        // Check cell to see if it's a header indicating the number of towers
        let candidateHeaderCell = sheet.getCellByA1(`${COLS['TWO'].MAP}${candidateHeaderRow}`);

        // Header rows take up 2 rows. If you check the bottom row, the data value is null.
        if (candidateHeaderCell.value) {
            const match = candidateHeaderCell.value.match(headerRegex);

            // Get the column set from the number of towers string in the header cell
            if (match) {
                return COLS[match[1].toUpperCase()];
            }
        }
        // If the header cell wasn't found, go up a row and try again.
        candidateHeaderRow -= 1;
    }

    throw `Could not find header row`;
}

module.exports = {
    data: builder,
    execute
};
