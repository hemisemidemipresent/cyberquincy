const GoogleSheetsHelper = require('../../helpers/google-sheets');
const gHelper = require('../../helpers/general.js');

const COLS = {
    ONE: {
        MAP: 'B',
        TOWERS: ['D'],
        VERSION: 'E',
        DATE: 'F',
        PERSON: 'G',
        LINK: 'I',
        CURRENT: 'J'
    },
    TWO: {
        MAP: 'B',
        TOWERS: ['D', 'E'],
        VERSION: 'F',
        DATE: 'G',
        PERSON: 'H',
        LINK: 'J',
        CURRENT: 'K'
    },
    THREE: {
        MAP: 'B',
        TOWERS: ['D', 'E', 'F'],
        VERSION: 'G',
        DATE: 'H',
        PERSON: 'I',
        LINK: 'K',
        CURRENT: 'L'
    },
    FOUR: {
        MAP: 'B',
        TOWERS: ['D', 'E', 'F', 'G'],
        VERSION: 'H',
        DATE: 'I',
        PERSON: 'J',
        LINK: 'L',
        CURRENT: 'M'
    },
    FIVE: {
        MAP: 'B',
        TOWERS: ['D', 'E', 'F', 'G', 'H'],
        VERSION: 'I',
        DATE: 'J',
        PERSON: 'K',
        LINK: 'M',
        CURRENT: 'N'
    },
    'SIX+': {
        MAP: 'B',
        '#': 'D',
        TOWERS: 'E',
        VERSION: 'J',
        DATE: 'K',
        PERSON: 'L',
        LINK: 'N',
        CURRENT: 'O'
    }
};

function sheetFTTC() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, 'fttc');
}

async function scrapeAllFTTCCombos() {
    const sheet = sheetFTTC()

    await sheet.loadCells(`${COLS['SIX+'].MAP}${1}:${COLS['SIX+'].CURRENT}${sheet.rowCount}`);

    let colset;
    let combos = [];

    // Search for the row in all "possible" rows
    for (let row = 1; row <= sheet.rowCount; row++) {
        parsedHeader = sectionHeader(row, sheet);
        if (parsedHeader) {
            colset = COLS[parsedHeader];
            row += 2;
            continue;
        }
        if (!colset) continue;

        var mapCandidate = sheet.getCellByA1(`${colset.MAP}${row}`).value;
        if (!mapCandidate) continue;

        combos = combos.concat(await getRowData(row, colset));
    }

    return combos;
}

function sectionHeader(mapRow, sheet) {
    // Looks for "One|Two|...|Five|Six+ Towers"
    headerRegex = new RegExp(`(${Object.keys(COLS).join('|').replace('+', '\\+')}) Tower Types?`, 'i');

    // Check cell to see if it's a header indicating the number of towers
    let candidateHeaderCell = sheet.getCellByA1(`${COLS['ONE'].MAP}${mapRow}`);

    // Header rows take up 2 rows. If you check the bottom row, the data value is null.
    if (candidateHeaderCell.value) {
        const match = candidateHeaderCell.value.match(headerRegex);

        // Get the column set from the number of towers string in the header cell
        if (match) {
            return match[1].toUpperCase();
        }
    }
}

async function getRowData(entryRow, colset) {
    return []
        .concat(await getRowStandardData(entryRow, colset))
        .concat(await getRowAltData(entryRow, colset))
        .filter((e) => e);
}

async function getRowStandardData(entryRow, colset) {
    const sheet = sheetFTTC();
    let values = { TOWERS: [] };

    // Six+
    if (Object.keys(colset).includes('#')) {
        values.TOWERS = sheet
            .getCellByA1(`**${colset['TOWERS']}${entryRow}**`)
            .value.split(',')
            .map((tower) => {
                return Aliases.getCanonicalForm(tower.trim());
            });
    } else {
        for (var i = 0; i < colset['TOWERS'].length; i++) {
            values.TOWERS.push(Aliases.getCanonicalForm(sheet.getCellByA1(`**${colset['TOWERS'][i]}${entryRow}**`).value));
        }
    }

    for (key in colset) {
        if (key == 'TOWERS') continue;
        values[key] = sheet.getCellByA1(`${colset[key]}${entryRow}`).value;
    }

    // Special formatting for date (get formattedValue instead)
    dateCell = sheet.getCellByA1(`${colset.DATE}${entryRow}`);
    values.DATE = dateCell.formattedValue;

    // Special handling for link (use hyperlink to cleverly embed in discord)
    linkCell = sheet.getCellByA1(`${colset.LINK}${entryRow}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    values.OG = true;

    // Special handling for current
    // (heavy checkmark doesn't format, use white heavy checkmark instead)
    if (values.CURRENT === gHelper.HEAVY_CHECK_MARK) {
        values.CURRENT = gHelper.WHITE_HEAVY_CHECK_MARK;
    }

    return values;
}

async function getRowAltData(entryRow, colset) {
    const sheet = sheetFTTC()
    mapCell = sheet.getCellByA1(`${colset.MAP}${entryRow}`);

    notes = mapCell.note;
    if (!notes) return null;

    return notes
        .trim()
        .split('\n')
        .map((entry) => {
            let towers, person, link;
            [towers, person, link] = entry.split('|').map((t) => t.replace(/ /g, ''));
            if (link.includes('bit.ly')) {
                link = `[${link}](http://${link})`
            } else if (link.includes('drive.google.com')) {
                link = `[Drive Image](${link})`
            } // Otherwise keep the link the same

            return {
                TOWERS: towers.split(',').map((t) => Aliases.getCanonicalForm(t.trim())),
                PERSON: person,
                LINK: link,
                MAP: mapCell.value,
                OG: false
            };
        });
}

module.exports = { scrapeAllFTTCCombos }