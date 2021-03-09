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
    CURRENT: 'J',
};

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);

const colours = require('../jsons/colours.json');

module.exports = {
    name: 'lcc',
    dependencies: ['btd6index'],

    aliases: ['leastcash', 'lcash'],

    execute,
    helpMessage,
    errorMessage,
};

function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return helpMessage(message);
    }

    const parsed = CommandParser.parse(args, new MapParser());

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors);
    }

    return displayLCC(message, parsed.map);
}

async function displayLCC(message, btd6_map) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'lcc');

    // Load the column containing the different maps
    await sheet.loadCells(`${COLS.MAP}${MIN_ROW}:${COLS.MAP}${MAX_ROW}`); // loads all possible cells with map

    // The row where the queried map is found
    var entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= MAX_ROW; row++) {
        var mapCandidate = sheet.getCellByA1(`${COLS.MAP}${row}`).value;
        // input is "in_the_loop" but needs to be compared to "In The Loop"
        if (
            mapCandidate &&
            mapCandidate.toLowerCase().replace(/ /g, '_') === btd6_map
        ) {
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
    if (values.CURRENT === HEAVY_CHECK_MARK) {
        values.CURRENT = WHITE_HEAVY_CHECK_MARK;
    }

    // Embed and send the message
    var challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`${values.MAP} LCC Combo`)
        .setColor(colours["index-lcc-yellow"]);

    for (field in values) {
        challengeEmbed = challengeEmbed.addField(
            gHelper.toTitleCase(field),
            values[field],
            true
        );
    }

    message.channel.send(challengeEmbed);
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!lcc` HELP')
        .addField(
            '`q!lcc <map>`',
            'The BTD6 Index entry for Least Cash CHIMPS for the queried map'
        )
        .addField(
            'Valid `<map>` values',
            '`logs`, `cubism`, `pen`, `#ouch`, ...'
        )
        .addField('Example', '`q!lcc bloodles`')
        .setColor(colours["index-lcc-yellow"]);

    return message.channel.send(helpEmbed);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('Input Error')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!lcc` for help', '\u200b')
        .setColor(colours['orange']);

    return message.channel.send(errorEmbed);
}
