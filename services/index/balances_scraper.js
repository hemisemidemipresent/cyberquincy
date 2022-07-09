const isEqual = require('lodash.isequal');
const GoogleSheetsHelper = require('../../helpers/google-sheets');

VERSION_COLUMN = 'C';
TOWER_HEADER_ROW = 23;
HERO_HEADER_ROW = 18;

async function scrapeAllBalanceChanges() {
    const towerBalances = await scrapeAllTowers()
    const heroBalances = await scrapeAllHeroes()
    return {
        ...towerBalances,
        ...heroBalances,
    }
}

///////////////////////////////////////////////
// TOWERS
///////////////////////////////////////////////

async function scrapeAllTowers() {
    const towersSheet = getTowersSheet();
    const currentVersion = await parseCurrentVersion(towersSheet);
    await loadBuffNerfCells(towersSheet, TOWER_HEADER_ROW, currentVersion);
    await loadTowerChangesCells(towersSheet, currentVersion)

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

        const versionAdded = await parseVersionAdded(towersSheet, TOWER_HEADER_ROW, colIndex, currentVersion)
        const balances = await parseTowerBalances(towersSheet, currentVersion, colIndex)

        towerBalances[tower] = {
            versionAdded: versionAdded,
            balances: balances,
        }
    }
    return towerBalances;
}

function getTowersSheet() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, 'Towers');
}

async function loadTowerChangesCells(towersSheet, currentVersion) {
    const changesTopLeft = `${VERSION_COLUMN}${getTowerChangesRowEquivalent(currentVersion, TOWER_HEADER_ROW)}`
    const changesBottomRight = GoogleSheetsHelper.rowColToA1(
        getTowerChangesRowEquivalent(currentVersion, TOWER_HEADER_ROW) + currentVersion - 1,
        towersSheet.columnCount
    )
    await towersSheet.loadCells(`${changesTopLeft}:${changesBottomRight}`)
}

async function parseTowerBalances(towersSheet, currentVersion, colIndex) {
    const balances = {}

    let rowIndex, changesRowIndex;
    // row index starts at the first row after the tower header row (row index vs row discrepancy)
    for(rowIndex = TOWER_HEADER_ROW; rowIndex < TOWER_HEADER_ROW + currentVersion - 1; rowIndex++) {
        const version = towersSheet.getCell(
            rowIndex,
            GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN)
        ).formattedValue;

        changesRowIndex = getTowerChangesRowEquivalent(currentVersion, rowIndex)

        const buffs = towersSheet.getCell(rowIndex, colIndex).note?.replace(/✔️/g, '✅')?.split('\n\n') || [];
        const nerfs = towersSheet.getCell(rowIndex, colIndex + 1).note?.split('\n\n') || [];
        const fixes = towersSheet.getCell(changesRowIndex, colIndex).note?.replace(/🟡/g, '⚠️')?.split('\n\n') || [];
        const changes = towersSheet.getCell(changesRowIndex, colIndex + 1).note?.replace(/🟦/g, "↔")?.split('\n\n') || [];

        balances[version] = {
            buffs: buffs,
            nerfs: nerfs,
            fixes: fixes,
            changes: changes,
        }
    }
    return balances
}

function getTowerChangesRowEquivalent(currentVersion, from) {
    return from + currentVersion + 2
}

///////////////////////////////////////////////
// HEROES
///////////////////////////////////////////////

async function scrapeAllHeroes() {
    const heroesSheet = getHeroesSheet();
    const currentVersion = await parseCurrentVersion(heroesSheet);
    await loadBuffNerfCells(heroesSheet, HERO_HEADER_ROW, currentVersion);
    const heroBalances = {}
    let colIndex;
    for (
        colIndex = GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN) + 1;
        colIndex < heroesSheet.columnCount;
        colIndex += 2
    ) {
        const heroHeader = heroesSheet.getCell(HERO_HEADER_ROW - 1, colIndex).value;

        if (!heroHeader) return heroBalances

        const hero = Aliases.getCanonicalForm(heroHeader);

        const versionAdded = await parseVersionAdded(heroesSheet, HERO_HEADER_ROW, colIndex, currentVersion)
        const balances = await parseHeroBalances(heroesSheet, currentVersion, colIndex)

        heroBalances[hero] = {
            versionAdded: versionAdded,
            balances: balances,
        }
    }
    return heroBalances;
}

function getHeroesSheet() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, 'Heroes');
}

async function parseHeroBalances(heroesSheet, currentVersion, colIndex) {
    const balances = {}

    let rowIndex;
    // row index starts at the first row after the tower header row (row index vs row discrepancy)
    for(rowIndex = HERO_HEADER_ROW; rowIndex < HERO_HEADER_ROW + currentVersion - 1; rowIndex++) {
        const version = heroesSheet.getCell(
            rowIndex,
            GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN)
        ).formattedValue;

        const buffLikes = heroesSheet.getCell(rowIndex, colIndex).note?.replace(/✔️/g, '✅')?.split('\n\n') || [];
        const nerfLikes = heroesSheet.getCell(rowIndex, colIndex + 1).note?.split('\n\n') || [];
        const combined = buffLikes.concat(nerfLikes).map(n => n.replace(/🟡/g, '⚠️').replace(/🟦/g, "↔"))

        const buffs = buffLikes.filter(n => n.trim().startsWith('✅'))
        const nerfs = nerfLikes.filter(n => n.trim().startsWith('❌'))
        const fixes = combined.filter(n => n.trim().startsWith('⚠️'))
        const changes = combined.filter(n => n.trim().startsWith('↔️'))

        balances[parseInt(version)] = {
            buffs: buffs,
            nerfs: nerfs,
            fixes: fixes,
            changes: changes,
        }
    }
    return balances
}

///////////////////////////////////////////////
// Shared
///////////////////////////////////////////////

async function parseCurrentVersion(sheet) {
    // Get version number from J3
    await sheet.loadCells(`J3`);
    const lastUpdatedAsOf = sheet.getCellByA1(`J3`).value;
    const lastUpdatedAsOfTokens = lastUpdatedAsOf.split(' ');
    version = lastUpdatedAsOfTokens[lastUpdatedAsOfTokens.length - 1];
    return Math.floor(new Number(version));
}

async function loadBuffNerfCells(sheet, headerRow, currentVersion) {
    bottomRightCellToBeLoaded = GoogleSheetsHelper.rowColToA1(
        headerRow + currentVersion - 1,
        sheet.columnCount
    );
    await sheet.loadCells(
        `${VERSION_COLUMN}${headerRow}:${bottomRightCellToBeLoaded}`
    );
}

async function parseVersionAdded(sheet, headerRow, colIndex, currentVersion) {
    let rowIndex, cellFormatting;
    for (rowIndex = headerRow; rowIndex < headerRow + currentVersion - 1; rowIndex++) {
        cellFormatting = sheet.getCell(rowIndex, colIndex).effectiveFormat
        // The version added is the first non-greyed out row for the column
        if (cellFormatting && !isEqual(cellFormatting.backgroundColor, { red: 0.6, green: 0.6, blue: 0.6 })) {
            const version = sheet.getCell(
                rowIndex,
                GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN)
            ).formattedValue;

            return version === '2.0' ? '1.0' : version;
        }
    }
}

module.exports = { 
    scrapeAllBalanceChanges,
}