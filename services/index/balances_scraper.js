const isEqual = require('lodash.isequal');
const GoogleSheetsHelper = require('../../helpers/google-sheets');

VERSION_COLUMN = 'C';
TOWER_HEADER_ROW = 23;

async function scrapeAllBalanceChanges() {
    const towerBalances = await scrapeAllTowers()
    const heroBalances = await scrapeAllHeroes()
    return {
        ...towerBalances,
        ...heroBalances,
    }
}

async function scrapeAllTowers() {
    const towersSheet = getTowersSheet();
    const currentVersion = await parseCurrentTowersVersion(towersSheet);
    await loadTowerCells(towersSheet, currentVersion);

    const towerBalances = {}
    let col;
    for (
        col =
            GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN) + 1;
        col < towersSheet.columnCount;
        col += 2
    ) {
        const towerHeader = towersSheet.getCell(TOWER_HEADER_ROW, col).value;

        if (!towerHeader) return towerBalances

        const tower = Aliases.getCanonicalForm(towerHeader);

        const versionAdded = await parseVersionAdded(towersSheet, col)
        const balanceChanges = await parseTowerBalanceChanges(towersSheet, currentVersion, col)

        towerBalances[tower] = {
            versionAdded: versionAdded,
            balanceChanges: balanceChanges,
        }
    }
    return towerBalances;
}

function getTowersSheet() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, 'Towers');
}

async function parseCurrentTowersVersion(towersSheet) {
    // Get version number from J3
    await towersSheet.loadCells(`J3`);
    const lastUpdatedAsOf = towersSheet.getCellByA1(`J3`).value;
    const lastUpdatedAsOfTokens = lastUpdatedAsOf.split(' ');
    version = lastUpdatedAsOfTokens[lastUpdatedAsOfTokens.length - 1];
    return Math.floor(new Number(version));
}

async function loadTowerCells(towersSheet, currentVersion) {
    bottomRightCellToBeLoaded = GoogleSheetsHelper.rowColToA1(
        TOWER_HEADER_ROW + currentVersion - 1,
        towersSheet.columnCount
    );
    await towersSheet.loadCells(
        `${VERSION_COLUMN}${TOWER_HEADER_ROW}:${bottomRightCellToBeLoaded}`
    );

    const changesRow = `${VERSION_COLUMN}${getTowerChangesHeaderRow(currentVersion)}`
    const changesCol = GoogleSheetsHelper.rowColToA1(
        getTowerChangesHeaderRow(currentVersion) + currentVersion - 1,
        towersSheet.columnCount
    )
    await towersSheet.loadCells(`${changesRow}:${changesCol}`)
}

async function parseVersionAdded(towersSheet, col) {
    let row;
    for (row = TOWER_HEADER_ROW; row < towersSheet.rowCount; row++) {
        // The version added is the first non-greyed out row for the column
        if (!isEqual(
            towersSheet.getCell(row, col).effectiveFormat?.backgrounColor,
            { red: 0.6, green: 0.6, blue: 0.6 }
        )) {
            const version = towersSheet.getCell(
                row,
                GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN)
            ).formattedValue;

            return version === '2.0' ? '1.0' : version;
        }
    }
}

async function parseTowerBalanceChanges(towersSheet, currentVersion, col) {
    const balanceChanges = {}

    let row, towerChangesHeaderRow;
    for(row = TOWER_HEADER_ROW; row < towersSheet + currentVersion - 2; row++) {
        const version = towersSheet.getCell(
            row,
            GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN)
        ).formattedValue;

        towerChangesHeaderRow = getTowerChangesHeaderRow(currentVersion)

        const buffs = sheet.getCell(row, col).note?.replace(/✔️/g, '✅')?.split('\n\n') || [];
        const nerfs = sheet.getCell(row, col + 1).note?.split('\n\n') || [];
        const fixes = sheet.getCell(towerChangesHeaderRow, col).note?.split('\n\n') || [];
        const changes = sheet.getCell(towerChangesHeaderRow, col + 1).note?.split('\n\n') || [];

        balanceChanges[version] = {
            buffs: buffs,
            nerfs: nerfs,
            fixes: fixes,
            changes: changes,
        }
    }
    return balanceChanges
}

function getTowerChangesHeaderRow(currentVersion) {
    return TOWER_HEADER_ROW + currentVersion + 2
}

async function scrapeAllHeroes() {
    return {}
}

module.exports = { 
    scrapeAllBalanceChanges,
}