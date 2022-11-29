const gHelper = require('./general.js');
const bHelper = require('./bloons-general')
const costs = require('../jsons/costs.json')

const TOWER_NAME_TO_BLOONOLOGY_LINK = {
    'dart_monkey': 'https://pastebin.com/raw/FK4a9ZSi',
    'boomerang_monkey': 'https://pastebin.com/raw/W2x9dvPs',
    'bomb_shooter': 'https://pastebin.com/raw/XaR4JafN',
    'tack_shooter': 'https://pastebin.com/raw/ywGCyWdT',
    'ice_monkey': 'https://pastebin.com/raw/3VKx3upE',
    'glue_gunner': 'https://pastebin.com/raw/cg8af3pj',
    'sniper_monkey': 'https://pastebin.com/raw/8uQuKygM',
    'monkey_sub': 'https://pastebin.com/raw/F9i5vPX9',
    'monkey_buccaneer': 'https://pastebin.com/raw/EuiGUBWs',
    'monkey_ace': 'https://pastebin.com/raw/hACdmBFa',
    'heli_pilot': 'https://pastebin.com/raw/dfwcqzDT',
    'mortar_monkey': 'https://pastebin.com/raw/64s0RqaZ',
    'dartling_gunner': 'https://pastebin.com/raw/DDkmKP6n',
    'wizard_monkey': 'https://pastebin.com/raw/4MsYDjFx',
    'super_monkey': 'https://pastebin.com/raw/SUxZg6Dk',
    'ninja_monkey': 'https://pastebin.com/raw/kPAF2hqw',
    alchemist: 'https://pastebin.com/raw/76m7ATYF',
    'druid_monkey': 'https://pastebin.com/raw/4egsjcpa',
    'banana_farm': 'https://pastebin.com/raw/Es0nVqt1',
    'spike_factory': 'https://pastebin.com/raw/tTHZWiSi',
    'monkey_village': 'https://pastebin.com/raw/e2QHaQSD',
    engineer: 'https://pastebin.com/raw/rTHT0L21'
};

function towerUpgradeToTower(towerUpgrade) {
    if (!towerUpgrade) return null;
    canonical = Aliases.getCanonicalForm(towerUpgrade);
    if (!canonical) return null;
    return canonical.split('#')[0];
}

function towerUpgradeToUpgrade(towerUpgrade) {
    return towerUpgrade.split('#')[1];
}

function allTowerUpgrades() {
    return []
        .concat(allPrimaryTowerUpgrades())
        .concat(allMilitaryTowerUpgrades())
        .concat(allMagicTowerUpgrades())
        .concat(allSupportTowerUpgrades());
}

// Gets all 0-0-0 tower names
function allTowers() {
    return [].concat(allPrimaryTowers()).concat(allMilitaryTowers()).concat(allMagicTowers()).concat(allSupportTowers());
}

function allTowerPaths() {
    const paths = allPaths()
    return allTowers().map(tower => {
        return paths.map(path => `${tower}#${path}`)
    }).flat();
}

function allPaths() {
    return Aliases.getAliasGroupsFromSameFileAs('top-path').map((ag) => ag.canonical);
}

function allTempleSets() {
    let all = [];
    // aaaaaaaaa 4 levels of for loops
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                for (let l = 0; l < 3; l++) {
                    let path = '' + i + j + k + l;
                    if (this.isValidTempleSet(path)) all.push(path); // holy shit this is stupid ~ the very person who wrote this
                }
            }
        }
    }
    return all;
}

// Warning: Slow! Use isHero instead or avoid reusing this method many times
function isTowerUpgrade(candidate) {
    if (!candidate || !gHelper.is_str(candidate)) return false;
    return allTowerUpgrades().includes(candidate.toLowerCase());
}

function isTowerUpgradeSet(candidate) {
    if (!candidate || !gHelper.is_str(candidate)) return false;
    if (!/[a-z]+#\d{3}/.test(candidate)) return false;

    let [tower, upgradeSet] = Aliases.canonicizeArg(candidate).split('#');

    return allTowers().includes(tower) && isValidUpgradeSet(upgradeSet);
}

function isTower(candidate) {
    if (!candidate || !gHelper.is_str(candidate)) return false;
    return allTowers().includes(candidate.toLowerCase());
}

function isTowerPath(candidate) {
    if (!candidate || !gHelper.is_str(candidate)) return false;
    return allTowerPaths().includes(candidate.toLowerCase());
}

function allPrimaryTowers() {
    return allGroupTowers('PRIMARY');
}

function allMilitaryTowers() {
    return allGroupTowers('MILITARY');
}

function allMagicTowers() {
    return allGroupTowers('MAGIC');
}

function allSupportTowers() {
    return allGroupTowers('SUPPORT');
}

function allPrimaryTowerUpgrades() {
    return allGroupTowerUpgrades('PRIMARY');
}

function allMilitaryTowerUpgrades() {
    return allGroupTowerUpgrades('MILITARY');
}

function allMagicTowerUpgrades() {
    return allGroupTowerUpgrades('MAGIC');
}

function allSupportTowerUpgrades() {
    return allGroupTowerUpgrades('SUPPORT');
}

function allGroupTowers(group) {
    return allGroupTowerCanonicals(group).filter((u) => !u.includes('#'));
}

function allGroupTowerUpgrades(group) {
    return allGroupTowerCanonicals(group).filter((u) => u.includes('#'));
}

GROUP_TO_TOWER = {
    PRIMARY: 'DART',
    MILITARY: 'HELI',
    MAGIC: 'WIZ',
    SUPPORT: 'FARM'
};

function allGroupTowerCanonicals(group) {
    return Aliases.getAliasGroupsFromSameImmediateDirectoryAs(GROUP_TO_TOWER[group]).map((ag) => ag.canonical);
}

function allWaterTowers() {
    return ['sub', 'bucc', 'brick'].map((t) => Aliases.getCanonicalForm(t));
}

function isWaterEntity(entity) {
    let entityToCompare;
    if (isTowerPath(entity)) {
        entityToCompare = entity.split('#')[0];
    } else if (isTowerUpgrade(entity)) {
        entityToCompare = towerUpgradeToTower(entity);
    } else if (Heroes.isHero(entity)) {
        entityToCompare = entity;
    } else if (isTower(entity)) {
        entityToCompare = entity;
    } else {
        throw `Entity ${entity} is not within allotted tower/path/upgrade/hero options`;
    }
    return allWaterTowers().includes(entityToCompare);
}

function isOfTower(entity, tower) {
    return entity.split('#')[0] === tower
}

function towerPathtoPath(towerPath) {
    return towerPath.split('#')[1];
}

function towerPathToTower(towerPath) {
    return towerPath.split('#')[0];
}

function towerPathToIndexNormalForm(towerPath) {
    let [tower, path] = towerPath.split('#');
    path = path
        .split('-')
        .map((tk) => gHelper.toTitleCase(tk))
        .join(' ');
    return `${Aliases.toIndexNormalForm(tower)} (${path})`;
}

function towerUpgradeToIndexNormalForm(upgrade) {
    const indexNormalUnformatted = Aliases.getAliasSet(upgrade)[1];
    return Aliases.toIndexNormalForm(indexNormalUnformatted);
}

function towerUpgradeFromTowerAndPathAndTier(tower, path, tier) {
    // Re-assign tower to canonical and ensure that it exists and is a tower
    if (!(tower = Aliases.getCanonicalForm(tower)) || !allTowers().includes(tower)) {
        throw 'First argument must be a tower';
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

    // Validate path
    if (!allPaths().includes(path)) {
        throw 'Second argument `path` must be top-path, middle-path, or bottom-path';
    }

    // Convert path + tier to appropriate upgrade string like 003 or 400
    const pathNum = allPaths().indexOf(path) + 1
    const upgradeInt = tier * Math.pow(10, 3 - pathNum);
    const upgradeStr = upgradeInt.toString().padStart(3, '0');

    // Combine tower with upgrade string to get tower upgrade canonical like wizard#300
    return towerUpgradeToIndexNormalForm(`${tower}#${upgradeStr}`);
}

function upgradesFromPath(path) {
    return [1, 2, 3, 4, 5].map(tier => upgradeFromPathAndTier(path, tier))
}

function upgradeFromPathAndTier(path, tier) {
    const entityPathIndex = allPaths().indexOf(path);
    return '0'.repeat(entityPathIndex) + `${tier}` + '0'.repeat(2 - entityPathIndex)
}

function pathTierFromUpgradeSet(upgradeSet) {
    const upgrades = upgradeSet.split('');
    let sortedUpgrades = [...upgrades].sort();
    const tier = sortedUpgrades[2];
    const path = allPaths()[upgrades.indexOf(tier)];
    return [path, tier];
}

function crossPathTierFromUpgradeSet(upgradeSet) {
    const paths = allPaths()
    const upgrades = upgradeSet.split('');
    let sortedUpgrades = [...upgrades].sort();
    let crossTier = sortedUpgrades[1];
    let crossPath = paths[upgrades.indexOf(crossTier)];

    if (sortedUpgrades[1] == sortedUpgrades[2]) {
        upgrades[paths.indexOf(crossPath)] = 0;
        crossPath = paths[upgrades.indexOf(crossTier)];
    }

    return [crossPath, crossTier];
}

function isValidUpgradeSet(u) {
    if (!gHelper.is_str(u) || u.length !== 3) return false;

    if (isNaN(u)) return false;

    // Get array of 3 digits, sorted in ascending order
    uSorted = u
        .split('')
        .map((c) => parseInt(c))
        .sort();

    if (uSorted[0] !== 0) return false;

    if (uSorted[1] > 2) return false;

    if (uSorted[2] > 5) return false;

    return true;
}
function isValidTempleSet(str) {
    if (!gHelper.is_str) return false;
    let upgrades = [];
    if (str.includes('/')) {
        if (str.length !== 7) return false;
        upgrades = str.split('/');
    } else if (str.length !== 4) return false;
    else upgrades = str.split('');
    upgrades = upgrades.map(function (x) {
        return parseInt(x);
    }); // converts arr of string to arr of ints
    let sum = 0;
    upgrades.forEach((element) => {
        sum += element;
    }); // finds sum of elements
    if (isNaN(sum)) return false; // all strings will be yeeted out here, since the sum will be a NaN
    if (sum > 7) return false; // stuff like 2222 gets thrown out
    upgrades.sort();
    if (upgrades[3] > 2) return false; // stuff like 3300 gets thrown out
    return true;
}

function formatEntity(entity) {
    if (isTower(entity)) {
        return Aliases.toIndexNormalForm(entity);
    } else if (isTowerPath(entity)) {
        [towerName, path] = entity.split('#');
        return `${gHelper.toTitleCase(path.split('_').join(' '))} ` + `${Aliases.toIndexNormalForm(towerName)}`;
    } else if (isTowerUpgrade(entity)) {
        return towerUpgradeToIndexNormalForm(entity);
    } else if (Heroes.isHero(entity)) {
        return gHelper.toTitleCase(entity);
    } else {
        throw `Entity ${entity} is not within allotted tower/path/upgrade/hero options`;
    }
}

function getEntityType(entity) {
    if (isTower(entity)) {
        return 'TOWER';
    } else if (isTowerPath(entity)) {
        return 'TOWER_PATH';
    } else if (isTowerUpgrade(entity)) {
        return 'TOWER_UPGRADE';
    } else if (Heroes.isHero(entity)) {
        return 'HERO';
    } else {
        throw `Entity ${entity} is not within allotted tower/path/upgrade/hero options`;
    }
}

function subUpgradesFromUpgradeSet(upgradeSet) {
    let [path, tier] = pathTierFromUpgradeSet(upgradeSet);
    let [crossPath, crossTier] = crossPathTierFromUpgradeSet(upgradeSet);

    let subTier, subCrossTier;

    const subUpgrades = ['000']
    for (subTier = 1; subTier <= tier; subTier++) {
        subUpgrades.push(upgradeFromPathAndTier(path, subTier))
    }
    for (subCrossTier = 1; subCrossTier <= crossTier; subCrossTier++) {
        subUpgrades.push(upgradeFromPathAndTier(crossPath, subCrossTier))
    }
    return subUpgrades
}

function costOfTowerUpgradeSet(towerName, upgradeSet, difficulty, numDiscounts=0) {
    const subUpgrades = subUpgradesFromUpgradeSet(upgradeSet)
    let totalCost = 0
    subUpgrades.forEach(subUpgrade => {
        totalCost += costOfTowerUpgrade(towerName, subUpgrade, difficulty, numDiscounts)
    })
    return totalCost
}

function costOfTowerUpgrade(towerName, upgrade, difficulty, numDiscounts=0) {
    let [path, tier] = pathTierFromUpgradeSet(upgrade);
    const tower = costs[towerName]
    const baseCost = upgrade === '000' ? tower.cost : tower.upgrades[path][`${tier}`]
    return bHelper.difficultyDiscountPriceMult(baseCost, difficulty, tier <= 3 ? numDiscounts : 0)
}

module.exports = {
    TOWER_NAME_TO_BLOONOLOGY_LINK,
    towerUpgradeToTower,
    towerUpgradeToUpgrade,
    allTowerUpgrades,
    allTowers,
    allTowerPaths,
    allPaths,
    allTempleSets,
    isTowerUpgrade,
    isTowerUpgradeSet,
    isTower,
    isTowerPath,
    allWaterTowers,
    isWaterEntity,
    isOfTower,
    towerPathToTower,
    towerPathtoPath,
    towerPathToIndexNormalForm,
    towerUpgradeToIndexNormalForm,
    towerUpgradeFromTowerAndPathAndTier,
    pathTierFromUpgradeSet,
    upgradesFromPath,
    crossPathTierFromUpgradeSet,
    isValidUpgradeSet,
    isValidTempleSet,
    formatEntity,
    getEntityType,
    costOfTowerUpgrade,
    costOfTowerUpgradeSet,
};
