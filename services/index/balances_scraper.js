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
    let colIndex;
    for (
        colIndex =
            GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN) + 1;
        colIndex < towersSheet.columnCount;
        colIndex += 2
    ) {
        const towerHeader = towersSheet.getCell(TOWER_HEADER_ROW - 1, colIndex).value;

        if (!towerHeader) return towerBalances

        const tower = Aliases.getCanonicalForm(towerHeader);

        const versionAdded = await parseVersionAdded(towersSheet, colIndex)
        const balanceChanges = await parseTowerBalanceChanges(towersSheet, currentVersion, colIndex)

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

    const changesRow = `${VERSION_COLUMN}${getTowerChangesRowEquivalent(currentVersion, TOWER_HEADER_ROW)}`
    const changesCol = GoogleSheetsHelper.rowColToA1(
        getTowerChangesRowEquivalent(currentVersion, TOWER_HEADER_ROW) + currentVersion - 1,
        towersSheet.columnCount
    )
    await towersSheet.loadCells(`${changesRow}:${changesCol}`)
}

async function parseVersionAdded(towersSheet, colIndex) {
    let rowIndex, cellFormatting;
    for (rowIndex = TOWER_HEADER_ROW; rowIndex < TOWER_HEADER_ROW + 4000 - 1; rowIndex++) {
        cellFormatting = towersSheet.getCell(rowIndex, colIndex).effectiveFormat
        // The version added is the first non-greyed out row for the column
        if (cellFormatting && !isEqual(cellFormatting.backgroundColor, { red: 0.6, green: 0.6, blue: 0.6 })) {
            const version = towersSheet.getCell(
                rowIndex,
                GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN)
            ).formattedValue;

            return version === '2.0' ? '1.0' : version;
        }
    }
}

async function parseTowerBalanceChanges(towersSheet, currentVersion, colIndex) {
    const balanceChanges = {}

    let rowIndex, towerChangesRowIndex;
    for(rowIndex = TOWER_HEADER_ROW; rowIndex < TOWER_HEADER_ROW + currentVersion - 1; rowIndex++) {
        const version = towersSheet.getCell(
            rowIndex,
            GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN)
        ).formattedValue;

        towerChangesRowIndex = getTowerChangesRowEquivalent(currentVersion, rowIndex + 1) - 1

        const buffs = towersSheet.getCell(rowIndex, colIndex).note?.replace(/✔️/g, '✅')?.split('\n\n') || [];
        const nerfs = towersSheet.getCell(rowIndex, colIndex + 1).note?.split('\n\n') || [];
        const fixes = towersSheet.getCell(towerChangesRowIndex, colIndex).note?.split('\n\n') || [];
        const changes = towersSheet.getCell(towerChangesRowIndex, colIndex + 1).note?.split('\n\n') || [];

        balanceChanges[version] = {
            buffs: buffs,
            nerfs: nerfs,
            fixes: fixes,
            changes: changes,
        }
    }
    return balanceChanges
}

function getTowerChangesRowEquivalent(currentVersion, from) {
    return from + currentVersion + 2
}

async function scrapeAllHeroes() {
    return {}
}

module.exports = { 
    scrapeAllBalanceChanges,
}