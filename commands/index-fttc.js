const MapParser = require('../parser/map-parser');
const AnyOrderParser = require('../parser/any-order-parser');
const OrParser = require('../parser/or-parser');
const OptionalParser = require('../parser/optional-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
const PersonParser = require('../parser/person-parser');
const TowerParser = require('../parser/tower-parser');
const GoogleSheetsHelper = require('../helpers/google-sheets');

const gHelper = require('../helpers/general.js');

const MIN_ROW = 1;
const MAX_ROW = 200;

const { orange, paleorange } = require('../jsons/colours.json');

const SHEET_NAME = 'Empty';

const COLS = {
    ONE: {
        MAP: 'B',
        TOWERS: ['D'],
        VERSION: 'F',
        DATE: 'G',
        PERSON: 'H',
        LINK: 'J',
        CURRENT: 'K',
    },
    TWO: {
        MAP: 'B',
        TOWERS: ['D', 'F'],
        VERSION: 'H',
        DATE: 'I',
        PERSON: 'J',
        LINK: 'L',
        CURRENT: 'M',
    },
    THREE: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H'],
        VERSION: 'J',
        DATE: 'K',
        PERSON: 'L',
        LINK: 'N',
        CURRENT: 'O',
    },
    FOUR: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H', 'J'],
        VERSION: 'L',
        DATE: 'M',
        PERSON: 'N',
        LINK: 'P',
        CURRENT: 'Q',
    },
    FIVE: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H', 'J', 'L'],
        VERSION: 'N',
        DATE: 'O',
        PERSON: 'P',
        LINK: 'R',
        CURRENT: 'S',
    }
};

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);

module.exports = {
    name: 'fttc',
    dependencies: ['btd6index'],

    execute,
    helpMessage,
    errorMessage,
};

async function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return helpMessage(message);
    }

    const parsed = CommandParser.parse(
        args,
        new AnyOrderParser(
            new OptionalParser(
                new OrParser(
                    new MapParser(),
                    new NaturalNumberParser()
                )
            ),
            new OptionalParser(new PersonParser()),
            new OptionalParser(new TowerParser())
        )
    );

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors);
    }

    let allResults = await parseFTTC();
    let filteredResults = filterResults(allResults, parsed); 
    displayResults(message, filteredResults);
    return true;
}

function displayResults(message, filteredResults) {
    console.log(filteredResults)
}

function filterResults(allCombos, parsed) {
    results = allCombos

     if (parsed.map) {
         results = results.filter(combo => combo.MAP == parsed.map)
     } else if (parsed.natural_number) {
        results = results.filter(combo => combo.TOWERS.length === parsed.natural_number)
    }

    if (parsed.person) {
        results = results.filter(combo => combo.PERSON.toLowerCase().split(' ').join('_') === parsed.person)
    }

    if (parsed.tower) {
        results = results.filter(combo => combo.TOWERS.includes(parsed.tower))
    }

    if (parsed.natural_number && !parsed.person) {
        results = results.filter(combo => combo.OG)
    }

    return results;
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!fttc` HELP')
        .addField(
            '`q!fttc <map>`',
            'The BTD6 Index Fewest Tower Type CHIMPS entry for the queried map\n`q!fttc fo`'
        )
        .addField(
            '`q!fttc <n>`',
            'All FTTCs with <n> towers'
        )
        .setColor(paleorange);

    return message.channel.send(helpEmbed);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('Input Error')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!fttc` for help', '\u200b')
        .setColor(orange);

    return message.channel.send(errorEmbed);
}

async function parseFTTC() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, SHEET_NAME);

    await sheet.loadCells(
        `${COLS['FOUR'].MAP}${MIN_ROW}:${COLS['FOUR'].CURRENT}${MAX_ROW}`
    );

    let colset;
    let combos = [];

    // Search for the row in all "possible" rows
    for (let row = MIN_ROW; row <= Math.min(MAX_ROW, sheet.rowCount); row++) {
        parsedHeader = sectionHeader(row, sheet);
        if (parsedHeader) {
            colset = COLS[parsedHeader]
            row += 2;
            continue;
        }
        if (!colset) continue;
        
        var mapCandidate = sheet.getCellByA1(`${colset.MAP}${row}`).value;
        if (!mapCandidate) continue;
        
        combos = combos.concat(await getRowData(row, colset))
    }

    return combos;
}

async function getRowData(entryRow, colset) {
    return [].concat(
        await getRowStandardData(entryRow, colset)
    ).concat(
        await getRowAltData(entryRow, colset)
    );
}

async function getRowStandardData(entryRow, colset) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, SHEET_NAME);
    let values = {TOWERS: []}

    for (var i = 0; i < colset['TOWERS'].length; i++) {
        values.TOWERS.push(
            Aliases.getCanonicalForm(
                sheet.getCellByA1(`**${colset['TOWERS'][i]}${entryRow}**`).value
            )
        );
    }

    for (key in colset) {
        if (key == 'TOWERS') continue;
        values[key] = sheet.getCellByA1(`${colset[key]}${entryRow}`).value;
    }

    values.MAP = values.MAP.toLowerCase();

    // Special formatting for date (get formattedValue instead)
    dateCell = sheet.getCellByA1(`${colset.DATE}${entryRow}`);
    values.DATE = dateCell.formattedValue;

    // Special handling for link (use hyperlink to cleverly embed in discord)
    linkCell = sheet.getCellByA1(`${colset.LINK}${entryRow}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    values.OG = true;

    // Special handling for current
    // (heavy checkmark doesn't format, use white heavy checkmark instead)
    if (values.CURRENT === HEAVY_CHECK_MARK) {
        values.CURRENT = WHITE_HEAVY_CHECK_MARK;
    }

    return values;
}

async function getRowAltData(entryRow, colset) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, SHEET_NAME);
    mapCell = sheet.getCellByA1(`${colset.MAP}${entryRow}`);

    notes = mapCell.note
    if (!notes) return {};

    return notes
            .trim()
            .split('\n')
            .map((entry) => {
                let towers, person, bitly;
                [towers, person, bitly] = entry
                    .split('|')
                    .map((t) => t.replace(/ /g, ''));
                
                return {
                    TOWERS: towers.split(',').map(t => Aliases.getCanonicalForm(t)),
                    PERSON: person,
                    LINK: `[${bitly}](http://${bitly})`,
                    MAP: mapCell.value.toLowerCase(),
                    OG: false,
                };
            })
}

function sectionHeader(mapRow, sheet) {
    // Looks for "One|Two|...|Five Towers" in the closest-above header cell
    headerRegex = new RegExp(
        `(${Object.keys(COLS).join('|')}) Tower Types?`,
        'i'
    );

    // Check cell to see if it's a header indicating the number of towers
    let candidateHeaderCell = sheet.getCellByA1(
        `${COLS['ONE'].MAP}${mapRow}`
    );

    // Header rows take up 2 rows. If you check the bottom row, the data value is null.
    if (candidateHeaderCell.value) {
        const match = candidateHeaderCell.value.match(headerRegex);

        // Get the column set from the number of towers string in the header cell
        if (match) {
            return match[1].toUpperCase();
        }
    }
}
