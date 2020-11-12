function towerUpgradeToTower(towerUpgrade) {
    return Aliases.getCanonicalForm(towerUpgrade).slice(0, -4);
}

function allTowerUpgrades() {
    return [].concat(allPrimaryTowerUpgrades())
             .concat(allMilitaryTowerUpgrades())
             .concat(allMagicTowerUpgrades())
             .concat(allSupportTowerUpgrades())
}

// Gets all 0-0-0 tower names
function allTowers() {
    return [].concat(allPrimaryTowers())
             .concat(allMilitaryTowers())
             .concat(allMagicTowers())
             .concat(allSupportTowers()) 
}

function allTowerPaths() {
    return allTowers().map(t => {
        return [`${t}#top-path`, `${t}#middle-path`, `${t}#bottom-path`]
    }).flat()
}

function isTowerUpgrade(candidate) {
    return allTowerUpgrades().includes(candidate.toLowerCase())
}

function isTower(candidate) {
    return allTowers().includes(candidate.toLowerCase())
}

function isTowerPath(candidate) {
    return allTowerPaths().includes(candidate.toLowerCase())
}

function allPrimaryTowers() {
    return allGroupTowers('PRIMARY')
}

function allMilitaryTowers() {
    return allGroupTowers('MILITARY')
}

function allMagicTowers() {
    return allGroupTowers('MAGIC')
}

function allSupportTowers() {
    return allGroupTowers('SUPPORT')
}

function allPrimaryTowerUpgrades() {
    return allGroupTowerUpgrades('PRIMARY')
}

function allMilitaryTowerUpgrades() {
    return allGroupTowerUpgrades('MILITARY')
}

function allMagicTowerUpgrades() {
    return allGroupTowerUpgrades('MAGIC')
}

function allSupportTowerUpgrades() {
    return allGroupTowerUpgrades('SUPPORT')
}

function allGroupTowers(group) {
    return allGroupTowerCanonicals(group).filter(u => !u.includes('#'))
}

function allGroupTowerUpgrades(group) {
    return allGroupTowerCanonicals(group).filter(u => u.includes('#'))
}

GROUP_TO_TOWER = {
    PRIMARY: 'DART',
    MILITARY: 'HELI',
    MAGIC: 'WIZ',
    SUPPORT: 'FARM',
}

function allGroupTowerCanonicals(group) {
    return Aliases.getAliasGroupsFromSameImmediateDirectoryAs(
        GROUP_TO_TOWER[group]
    ).map(ag => ag.canonical)
}

function allWaterTowers() {
    return ['sub', 'bucc', 'brick'].map((t) => Aliases.getCanonicalForm(t));
}

function towerUpgradeToIndexNormalForm(upgrade) {
    const indexNormalUnformatted = Aliases.getAliasSet(upgrade)[1];
    return Aliases.toIndexNormalForm(indexNormalUnformatted);
}

function towerUpgradeFromTowerAndPathAndTier(tower, path, tier) {
    // Re-assign tower to canonical and ensure that it exists and is a tower
    if (
        !(tower = Aliases.getCanonicalForm(tower)) ||
        !allTowers().includes(tower)
    ) {
        throw 'First argument must be a tower';
    }

    // Validate path
    if (isNaN(path)) {
        throw 'Second argument `path` must be 1, 2, or 3';
    }
    try {
        path = parseInt(path);
    } catch (e) {
        throw 'Second argument `path` must be 1, 2, or 3';
    }

    if (path < 1 || path > 3) {
        throw 'Second argument `path` must be 1, 2, or 3';
    }

    // Validate tier
    if (!tier) {
        return towerUpgradeToIndexNormalForm(`${tower}#222`);
    }

    if (isNaN(tier)) {
        throw 'Third argument `tier` must be an integer between 0 and 5 inclusive';
    }
    try {
        tier = parseInt(tier);
    } catch (e) {
        throw 'Third argument `tier` must be an integer between 0 and 5 inclusive';
    }

    if (tier < 0 || tier > 5) {
        throw 'Third argument `tier` must be an integer between 0 and 5 inclusive';
    }

    // Convert path + tier to appropriate upgrade string like 003 or 400
    const upgradeInt = tier * Math.pow(10, 3 - path);
    const upgradeStr = upgradeInt.toString().padStart(3, '0');

    // Combine tower with upgrade string to get tower upgrade canonical like wizard#300
    return towerUpgradeToIndexNormalForm(`${tower}#${upgradeStr}`);
}

function pathTierFromUpgradeSet(upgradeSet) {
    upgrades = upgradeSet.split('')
    let sortedUpgrades = [...upgrades].sort();
    const tier = sortedUpgrades[2];
    const path = upgrades.findIndex(u => u == tier) + 1
    return [path, tier]
}

function crossPathTierFromUpgradeSet(upgradeSet) {
    upgrades = upgradeSet.split('')
    let sortedUpgrades = [...upgrades].sort();
    const crossTier = sortedUpgrades[1];
    const crossPath = upgrades.findIndex(u => u == crossTier) + 1
    return [crossPath, crossTier]
}

function isValidUpgradeSet(u) {
    if (!h.is_str(u) || u.length !== 3) return false;

    if (isNaN(u)) return false;

    // Get array of 3 digits, sorted in ascending order
    uSorted = u.split('').map(c => parseInt(c)).sort()

    if (uSorted[0] !== 0) return false;

    if (uSorted[1] > 2) return false;

    if (uSorted[2] > 5) return false;

    return true;
}

function formatTower(tower) {
    if (isTower(tower)) {
        return `${towerUpgradeToIndexNormalForm(tower)}`
    } else if (isTowerPath(tower)) {
        [towerName, path] = tower.split('#')
        return `${h.toTitleCase(path.split('-').join(' '))} ` +
                `${towerUpgradeToIndexNormalForm(towerName)}`
    } else if(isTowerUpgrade(tower)) {
        return `${towerUpgradeToIndexNormalForm(tower)}`
    } else if (Aliases.isHero(tower)) {
        return `${h.toTitleCase(tower)}`
    } else {
        throw `Tower ${tower} is not within allotted tower/hero category`
    }
}

module.exports = {
    towerUpgradeToTower,
    allTowerUpgrades,
    allTowers,
    allTowerPaths,
    isTowerUpgrade,
    isTower,
    isTowerPath,
    allWaterTowers,
    towerUpgradeToIndexNormalForm,
    towerUpgradeFromTowerAndPathAndTier,
    pathTierFromUpgradeSet,
    crossPathTierFromUpgradeSet,
    isValidUpgradeSet,
    formatTower,
}