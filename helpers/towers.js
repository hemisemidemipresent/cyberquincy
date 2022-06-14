const gHelper = require('../helpers/general.js');
const bHelper = require('../helpers/bloons-general');

function towerUpgradeToTower(towerUpgrade) {
    if (!towerUpgrade) return null;
    canonical = Aliases.getCanonicalForm(towerUpgrade);
    if (!canonical) return null;
    return canonical.slice(0, -4);
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
    return allTowers()
        .map((t) => {
            return [`${t}#top-path`, `${t}#middle-path`, `${t}#bottom-path`];
        })
        .flat();
}
function allTempleSets() {
    let all = [];
    // holy shit go outside
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
        entityToCompare = entity.split('#')[0]
    } else if (isTowerUpgrade(entity)) {
        entityToCompare = towerUpgradeToTower(entity)
    } else if (Aliases.isHero(entity)) {
        entityToCompare = entity;
    } else if (isTower(entity)) {
        entityToCompare = entity
    } else {
        throw `Entity ${entity} is not within allotted tower/path/upgrade/hero options`;
    }
    return allWaterTowers().includes(entityToCompare);
}

function towerPathToIndexNormalForm(towerPath) {
    let [tower, path] = towerPath.split('#');
    path = path.split('-')
                .map((tk) => gHelper.toTitleCase(tk))
                .join(' ');
    return `${Aliases.toIndexNormalForm(tower)} (${path})`
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
    upgrades = upgradeSet.split('');
    let sortedUpgrades = [...upgrades].sort();
    const tier = sortedUpgrades[2];
    const path = upgrades.findIndex((u) => u == tier) + 1;
    return [path, tier];
}

function crossPathTierFromUpgradeSet(upgradeSet) {
    upgrades = upgradeSet.split('');
    let sortedUpgrades = [...upgrades].sort();
    let crossTier = sortedUpgrades[1];
    let crossPath = upgrades.findIndex((u) => u == crossTier) + 1;
    if (sortedUpgrades[1] == sortedUpgrades[2]) {
        upgrades[crossPath - 1] = 0;
        crossPath = upgrades.findIndex((u) => u == crossTier) + 1;
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
        return towerUpgradeToIndexNormalForm(entity);
    } else if (isTowerPath(entity)) {
        [towerName, path] = entity.split('#');
        return `${gHelper.toTitleCase(path.split('-').join(' '))} ` + `${towerUpgradeToIndexNormalForm(towerName)}`;
    } else if (isTowerUpgrade(entity)) {
        return towerUpgradeToIndexNormalForm(entity);
    } else if (Aliases.isHero(entity)) {
        return gHelper.toTitleCase(entity);
    } else {
        throw `Entity ${entity} is not within allotted tower/path/upgrade/hero options`;
    }
}

function getEntityType(entity) {
    if (isTower(entity)) {
        return 'TOWER';
    } else if (isTowerPath(entity)) {
        return 'TOWER_PATH'
    } else if (isTowerUpgrade(entity)) {
        return 'TOWER_UPGRADE';
    } else if (Aliases.isHero(entity)) {
        return 'HERO';
    } else {
        throw `Entity ${entity} is not within allotted tower/path/upgrade/hero options`;
    }
}

function totalTowerUpgradeCrosspathCost(json, towerName, upgrade) {
    // uses different json format found in ../jsons/costs.json

    let [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);
    let [crossPath, crossTier] = Towers.crossPathTierFromUpgradeSet(upgrade);
    let tower = json[`${towerName}`];

    let totalCost = tower.cost; // base cost of tower

    for (let i = 0; i < tier; i++) {
        // main path of tower
        totalCost += tower.upgrades[`${path}`][i];
    }

    for (let i = 0; i < crossTier; i++) {
        // cross path of tower
        totalCost += tower.upgrades[`${crossPath}`][i];
    }
    return totalCost;
}

function totalTowerUpgradeCrosspathCostMult(json, towerName, upgrade, difficulty) {
    // uses different json format found in ../jsons/costs.json

    let [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);
    let [crossPath, crossTier] = Towers.crossPathTierFromUpgradeSet(upgrade);
    let tower = json[`${towerName}`];
    let totalCost = bHelper.difficultyPriceMult(tower.cost, difficulty); // base cost of tower

    for (let i = 0; i < tier; i++) {
        // main path of tower
        totalCost += bHelper.difficultyPriceMult(tower.upgrades[`${path}`][i], difficulty);
    }

    for (let i = 0; i < crossTier; i++) {
        // cross path of tower
        totalCost += bHelper.difficultyPriceMult(tower.upgrades[`${crossPath}`][i], difficulty);
    }
    return totalCost;
}
function upgradeCost(tower, path, tier) {
    let totalCost = 0;
    for (let i = 1; i <= tier; i++) {
        totalCost += tower.upgrades[`${path}`][tier - 1];
    }
    return totalCost;
}

// legacy
function hard(cost) {
    return Math.round((cost * 1.08) / 5) * 5;
}

function totalTowerUpgradeCrosspathCostHard(json, towerName, upgrade) {
    // uses different json format found in ../jsons/costs.json

    let [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);
    let [crossPath, crossTier] = Towers.crossPathTierFromUpgradeSet(upgrade);
    let tower = json[`${towerName}`];
    let totalCost = hard(tower.cost); // base cost of tower

    for (let i = 0; i < tier; i++) {
        // main path of tower
        totalCost += hard(tower.upgrades[`${path}`][i]);
    }

    for (let i = 0; i < crossTier; i++) {
        // cross path of tower
        totalCost += hard(tower.upgrades[`${crossPath}`][i]);
    }
    return totalCost;
}
module.exports = {
    towerUpgradeToTower,
    allTowerUpgrades,
    allTowers,
    allTowerPaths,
    allTempleSets,
    isTowerUpgrade,
    isTower,
    isTowerPath,
    allWaterTowers,
    isWaterEntity,
    towerPathToIndexNormalForm,
    towerUpgradeToIndexNormalForm,
    towerUpgradeFromTowerAndPathAndTier,
    pathTierFromUpgradeSet,
    crossPathTierFromUpgradeSet,
    isValidUpgradeSet,
    isValidTempleSet,
    formatEntity,
    getEntityType,
    totalTowerUpgradeCrosspathCost,
    totalTowerUpgradeCrosspathCostHard,
    totalTowerUpgradeCrosspathCostMult,
    upgradeCost,
    hard
};
