const MapParser = require('../parser/map-parser');
const AnyOrderParser = require('../parser/any-order-parser');
const OrParser = require('../parser/or-parser');
const ExactStringParser = require('../parser/exact-string-parser');
const EmptyParser = require('../parser/empty-parser');
const GoogleSheetsHelper = require('../helpers/google-sheets');

const MIN_ROW = 1;
const MAX_ROW = 100;

const COLS = {
    TWO: {
        MAP: 'B',
        TOWERS: ['D', 'F'],
        UPGRADES: 'H',
        VERSION: 'J',
        DATE: 'K',
        PERSON: 'L',
        LINK: 'N',
        CURRENT: 'O',
    },
    THREE: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H'],
        UPGRADES: 'J',
        VERSION: 'L',
        DATE: 'M',
        PERSON: 'N',
        LINK: 'P',
        CURRENT: 'Q',
    },
    FOUR: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H', 'J'],
        UPGRADES: 'L',
        VERSION: 'O',
        DATE: 'P',
        PERSON: 'Q',
        LINK: 'S',
        CURRENT: 'T',
    },
    FIVE: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H', 'J', 'L'],
        UPGRADES: 'N',
        VERSION: 'Q',
        DATE: 'R',
        PERSON: 'S',
        LINK: 'U',
        CURRENT: 'V',
    },
    'SIX+': {
        MAP: 'B',
        AMOUNT: 'D',
        VERSION: 'E',
        DATE: 'F',
        PERSON: 'G',
        LINK: 'I',
        CURRENT: 'J',
    },
};

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);

module.exports = {
    name: 'ltc',
    dependencies: ['btd6index'],

    execute,
    helpMessage,
    errorMessage,
};

function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return helpMessage(message);
    }

    const parseModifier = new OrParser(
        new ExactStringParser('OG'),
        new ExactStringParser('CHEAPEST'),
        new EmptyParser()
    );

    const parsed = CommandParser.parse(
        args,
        new AnyOrderParser(new MapParser(), parseModifier)
    );

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors);
    }

    displayLTC(message, parsed.map, parsed.exact_string);
    return true;
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!ltc` HELP')
        .addField(
            '`q!ltc <map>`',
            'The BTD6 Index Least Tower CHIMPS entry for the queried map\n`q!2mp fo`'
        )
        .addField(
            '`q!ltc <map> chp`',
            'The BTD6 Index Least Tower CHIMPS cheapest entry for the queried map\n`q!2mp eotr cheapest`'
        )
        .addField(
            '`q!ltc <map> og`',
            'The BTD6 Index Least Tower CHIMPS originally completed entry for the queried map (Needs to match tower amount of current LTC).\n`q!2mp og dc`'
        );

    return message.channel.send(helpEmbed);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!ltc` for help', '\u200b')
        .setColor(colours['orange']);

    return message.channel.send(errorEmbed);
}

async function displayLTC(message, btd6_map, modifier) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'ltc');

    // Load the column containing the different maps
    await sheet.loadCells(
        `${COLS['TWO'].MAP}${MIN_ROW}:${COLS['TWO'].MAP}${MAX_ROW}`
    ); // loads all possible cells with map

    // The row where the queried map is found
    var entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= MAX_ROW; row++) {
        var mapCandidate = sheet.getCellByA1(`${COLS['TWO'].MAP}${row}`).value;
        // input is "in_the_loop" but needs to be compared to "In The Loop"
        if (
            mapCandidate &&
            mapCandidate.toLowerCase().replace(/ /g, '_') === btd6_map
        ) {
            entryRow = row;
            break;
        }
    }

    // Determines correspondence between column letter and data type depending on
    // how many towers it took to complete the LTC run
    colset = getColumnSet(entryRow, sheet);

    // Load the row where the map was found
    await sheet.loadCells(
        `${colset.MAP}${entryRow}:${colset.CURRENT}${entryRow}`
    );

    // Values to be included in the LTC embedded message
    values = {};

    if (modifier == 'cheapest') {
        return await getRowAltData(message, entryRow, 'CHEAPEST', colset);
    } else if (modifier == 'og') {
        return await getRowAltData(message, entryRow, 'OG', colset);
    } else {
        return await getRowStandardData(message, entryRow, colset);
    }
}

async function getRowStandardData(message, entryRow, colset) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'ltc');

    // Towers + Upgrades need some special handling since #towers varies
    if (colset['TOWERS']) {
        const upgrades = sheet
            .getCellByA1(`${colset['UPGRADES']}${entryRow}`)
            .value.split('|')
            .map((u) => u.replace(/^\s+|\s+$/g, ''));

        for (var i = 0; i < colset['TOWERS'].length; i++) {
            values[`Tower ${i + 1}`] =
                sheet.getCellByA1(`**${colset['TOWERS'][i]}${entryRow}**`)
                    .value +
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
    if (values.CURRENT === HEAVY_CHECK_MARK) {
        values.CURRENT = WHITE_HEAVY_CHECK_MARK;
    }

    // Embed and send the message
    var challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`${values.MAP} LTC Combo`)
        .setColor(colours['cyber']);

    for (field in values) {
        challengeEmbed = challengeEmbed.addField(
            gHelper.toTitleCase(field),
            values[field],
            true
        );
    }

    return message.channel.send(challengeEmbed);
}

async function getRowAltData(message, entryRow, qualifier, colset) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'ltc');

    mapCell = sheet.getCellByA1(`${colset.MAP}${entryRow}`);
    notes = parseMapNotes(mapCell.note);

    if (!notes || !notes[qualifier]) {
        return await getRowStandardData(message, entryRow, colset);
    }

    var challengeEmbed = new Discord.MessageEmbed()
        .setTitle(
            `${gHelper.toTitleCase(qualifier)} ${mapCell.value} LTC Combo`
        )
        .setColor(colours['cyber'])
        .addField('Person', notes[qualifier].PERSON, true)
        .addField('Link', notes[qualifier].LINK, true);

    return message.channel.send(challengeEmbed);
}

function parseMapNotes(notes) {
    if (!notes) return {};
    return Object.fromEntries(
        notes
            .trim()
            .split('\n')
            .map((n) => {
                let qualifier, person, bitly;
                [qualifier, person, bitly] = n
                    .split(/[,:]/)
                    .map((t) => t.replace(/ /g, ''));

                return [
                    qualifier.toUpperCase(),
                    {
                        PERSON: person,
                        LINK: `[${bitly}](http://${bitly})`,
                    },
                ];
            })
    );
}

function getColumnSet(mapRow, sheet) {
    // Looks for "Two|Three|...|Six+ Towers" in the closest above header cell
    headerRegex = new RegExp(
        `(${Object.keys(COLS).join('|').replace('+', '\\+')}) Towers`,
        'i'
    );

    candidateHeaderRow = mapRow - 1;
    while (true) {
        // Check cell to see if it's a header indicating the number of towers
        let candidateHeaderCell = sheet.getCellByA1(
            `${COLS['TWO'].MAP}${candidateHeaderRow}`
        );

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
}
