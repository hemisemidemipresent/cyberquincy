const GoogleSheetsHelper = require('../../helpers/google-sheets.js');
const gHelper = require('../../helpers/general.js');

const COLS = {
    NUMBER: 'B',
    TOWER_1: 'C',
    TOWER_2: 'E',
    UPGRADES: 'G',
    MAP: 'I',
    VERSION: 'K',
    DATE: 'L',
    PERSON: 'M',
    LINK: 'O',
    CURRENT: 'P',
};

function sheet2TC() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');
}

async function scrapeAll2TCCombos() {
    const sheet = sheet2TC();

    const nCombos = await numCombos();
    const rOffset = await findOGRowOffset();
    await sheet.loadCells(
        `${COLS.NUMBER}${rOffset + 1}:${COLS.CURRENT}${rOffset + nCombos}`
    );

    let combos = [];
    for (let n = 1; n <= nCombos; n++) {
        combos.push(
            parsePreloadedRow(rOffset + n)
        )
    }

    return combos;
}

async function numCombos() {
    const sheet = sheet2TC();
    await sheet.loadCells(`J6`);
    return sheet.getCellByA1('J6').value;
}

////////////////////////////////////////////////////////////
// OG Combos
////////////////////////////////////////////////////////////

function parsePreloadedRow(row) {
    const sheet = sheet2TC();

    // Assign each value to be discord-embedded in a simple default way
    let values = {};
    const ogSpecificCols = Object.keys(COLS).filter(col => !['PERSON', 'MAP', 'LINK'].includes(col))
    for (key of ogSpecificCols) {
        values[key] = sheet.getCellByA1(`${COLS[key]}${row}`).value;
    }

    const upgrades = values.UPGRADES.split('|').map((u) =>
        u.replace(/^\s+|\s+$/g, '')
    );
    for (var i = 0; i < upgrades.length; i++) {
        // Display upgrade next to tower
        values[`TOWER_${i + 1}`] = {
            NAME: values[`TOWER_${i + 1}`],
            UPGRADE: upgrades[i],
        };
    }
    delete values.UPGRADES; // Don't display upgrades on their own, display with towers

    // Recapture date to format properly
    values.DATE = sheet.getCellByA1(`${COLS.DATE}${row}`).formattedValue;

    // Replace checkmark that doesn't display in embedded with one that does
    if (values.CURRENT === gHelper.HEAVY_CHECK_MARK) {
        values.CURRENT = gHelper.WHITE_HEAVY_CHECK_MARK;
    }

    values.VERSION = values.VERSION.toString();

    values.MAPS = parseMapCompletions(row)

    return values;
}

async function findOGRowOffset() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');

    const MIN_OFFSET = 1;
    const MAX_OFFSET = 20;

    await sheet.loadCells(
        `${COLS.NUMBER}${MIN_OFFSET}:${COLS.NUMBER}${MAX_OFFSET}`
    );

    for (var row = MIN_OFFSET; row <= MAX_OFFSET; row++) {
        const cellValue = sheet.getCellByA1(`B${row}`).value;
        if (cellValue) {
            if (cellValue.toLowerCase().includes('number')) {
                return row;
            }
        }
    }

    throw `Cannot find 2TC header "Number" to orient combo searching`;
}

function parseMapCompletions(row) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');

    const ogCells = Object.fromEntries(
        ['MAP', 'PERSON', 'LINK'].map(col => {
            return [col, sheet.getCellByA1(`${COLS[col]}${row}`)]
        }
    ))

    const ogMapCompletion = {
        PERSON: ogCells.PERSON.value,
        LINK: `[${ogCells.LINK.value}](${ogCells.LINK.hyperlink})`,
        OG: true,
    }

    const ogMapAbbr = Aliases.mapToIndexAbbreviation(
        Aliases.toAliasNormalForm(ogCells.MAP.value)
    );
 
    // Circular Dependency
    const { parseMapNotes } = require('../../helpers/index')

    const maps = {
        [ogMapAbbr]: ogMapCompletion,
        ...parseMapNotes(ogCells.MAP.note),
    }

    return maps
}

module.exports = { 
    scrapeAll2TCCombos,
    COLS,
}