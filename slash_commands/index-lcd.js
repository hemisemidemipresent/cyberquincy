const MapParser = require('../parser/map-parser.js');
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

const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

let mapOption = new SlashCommandStringOption().setName('map').setDescription('Map').setRequired(true);

builder = new SlashCommandBuilder()
    .setName('lcd')
    .setDescription('Search and Browse Completed LCD Index Combos')
    .addStringOption(mapOption);

async function execute(interaction) {
    const mapArg = interaction.options.getString('map');
    const canonicalMap = Aliases.getCanonicalForm(mapArg);

    const parsed = CommandParser.parse([canonicalMap], new MapParser());

    if (parsed.hasErrors()) {
        return await interaction.reply('Map provided not valid');
    } else {
        let challengeEmbed = await lcd(parsed.map);
        return await interaction.reply({ embeds: [challengeEmbed] });
    }
}

async function lcd(btd6_map) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'lcd');

    // Load the column containing the different maps
    await sheet.loadCells(`${COLS.MAP}${MIN_ROW}:${COLS.MAP}${MAX_ROW}`); // loads all possible cells with map

    // The row where the queried map is found
    var entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= MAX_ROW; row++) {
        var mapCandidate = sheet.getCellByA1(`${COLS.MAP}${row}`).value;
        // input is "in_the_loop" but needs to be compared to "In The Loop"
        if (mapCandidate && mapCandidate.toLowerCase().replace(/ /g, '_') === btd6_map) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw `Something has gone horribly wrong; ${btd6_map} passed parsing validation but can't be found in the LCD spreadsheet`;
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
    var challengeEmbed = new Discord.EmbedBuilder().setTitle(`${values.MAP} LCD Combo`).setColor(paleyellow);

    for (field in values) {
        if (values[field])
            challengeEmbed = challengeEmbed.addFields([
                { name: gHelper.toTitleCase(field), value: values[field].toString(), inline: true }
            ]);
    }

    return challengeEmbed;
}

module.exports = {
    data: builder,
    execute
};
