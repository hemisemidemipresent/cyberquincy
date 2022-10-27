const GoogleSheetsHelper = require('../../helpers/google-sheets.js');
const Maps = require('../../helpers/maps')

const COLS = {
    NUMBER: 'B',
    ENTITY: 'C',
    UPGRADE: 'E',
    OG_MAP: 'F',
    VERSION: 'H',
    DATE: 'I',
    PERSON: 'J',
    LINK: 'L',
};

function sheet2MP() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');
}

async function scrapeAll2MPCompletions() {
    const sheet = sheet2MP();

    // Load ENTITY and MAP columns
    let [startRow, endRow] = await rowBoundaries();
    await sheet.loadCells(`${COLS.NUMBER}${startRow}:${COLS.LINK}${endRow}`);

    let combos = []
    // Retrieve og- and -map notes from each tower row
    for (var row = startRow; row <= endRow; row++) {
        combos.push(
            parsePreloadedRow(row)
        );
    }

    return combos;
}

async function rowBoundaries() {
    const sheet = sheet2MP();
    await sheet.loadCells(`${COLS.NUMBER}1:${COLS.NUMBER}${sheet.rowCount}`);

    startRow = null;
    endRow = null;

    for (let row = 1; row <= sheet.rowCount; row++) {
        numberCandidate = sheet.getCellByA1(`${COLS.NUMBER}${row}`).value;

        // If startRow has been found, find the first occurence of a blank cell
        if (startRow && !numberCandidate) {
            endRow = row - 1;
            break;
        } else if (
            numberCandidate &&
            numberCandidate.replace(/ /g, '') === '1st'
        ) {
            startRow = row;
        }
    }

    if (!startRow) {
        throw `Orientation failed because \`1st\` couldn't be found in the "Number" column.`
    }

    // If there wasn't a trailing blank cell, then the last cell viewed must be the end cell
    if (!endRow) endRow = sheet.rowCount;

    return [startRow, endRow];
}

// Assumes appropriate cells are loaded beforehand!
function parsePreloadedRow(row) {
    const sheet = sheet2MP();

    let completion = {}
    for (const col of ["NUMBER", "ENTITY", "UPGRADE", "VERSION"]) {
        completion[col] = sheet.getCellByA1(`${COLS[col]}${row}`).value;
    }
    completion.DATE = sheet.getCellByA1(`${COLS.DATE}${row}`).formattedValue;

    completion.MAPS = parseMapCompletions(row);

    return completion
}

function parseMapCompletions(row) {
    const sheet = sheet2MP();

    const ogMapCell = sheet.getCellByA1(`${COLS.OG_MAP}${row}`);
    const ogMapAbbr = Maps.indexNormalFormToMapAbbreviation(ogMapCell.value)
    const ogPerson = sheet.getCellByA1(`${COLS.PERSON}${row}`).value;
    const ogLinkCell = sheet.getCellByA1(`${COLS.LINK}${row}`);

    const ogMapCompletion = {
        PERSON: ogPerson,
        LINK: `[${ogLinkCell.value}](${ogLinkCell.hyperlink})`,
        OG: true,
    };

     // Circular Dependency
     const { parseMapNotes } = require('../../helpers/index')

    // Add rest of maps found in notes
    const maps = {
        [ogMapAbbr]: ogMapCompletion,
        ...parseMapNotes(ogMapCell.note),
    };

    return maps
}

module.exports = { 
    scrapeAll2MPCompletions,
    COLS
}