const gHelper = require('./general.js');
const bHelper = require('./bloons-general.js');
const costs = require('../jsons/costs.json');
const costs_b2 = require('../jsons/costs_b2.json');

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
    const paths = allPaths();
    return allTowers()
        .map((tower) => {
            return paths.map((path) => `${tower}#${path}`);
        })
        .flat();
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

function isTowerUpgrade(candidate, allowCrosspath = false) {
    if (!candidate || !gHelper.is_str(candidate)) return false;
    if (!/[a-z]+#\d{3}/.test(candidate.toLowerCase())) return false;

    let [tower, upgradeSet, anotherUpgradeSet] = Aliases.canonicizeArg(candidate).split('#');

    // If candidate is sotf#100, canonicize arg will return druid#050#100 which doesn't make sense.
    // We catch this by ensuring that we only have tower#upgradeSet.
    if (anotherUpgradeSet) return false;

    return isTower(tower) && isValidUpgradeSet(upgradeSet, allowCrosspath);
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
        const [tower, path] = entity.split('#');
        if (tower == 'beast_handler' && path == 'top_path') {
            return true;
        } else {
            entityToCompare = tower;
        }
    } else if (isTowerUpgrade(entity)) {
        const [tower, upgrade] = entity.split('#');
        const [path] = pathTierFromUpgradeSet(upgrade);
        if (tower == 'beast_handler' && path == 'top_path') {
            return true;
        } else {
            entityToCompare = towerUpgradeToTower(entity);
        }
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
    return entity.split('#')[0] === tower;
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
    if (!tier) return towerUpgradeToIndexNormalForm(`${tower}#222`);

    if (isNaN(tier)) throw 'Third argument `tier` must be an integer between 0 and 5 inclusive';

    try {
        tier = parseInt(tier);
    } catch (e) {
        throw 'Third argument `tier` must be an integer between 0 and 5 inclusive';
    }

    if (tier < 0 || tier > 5) throw 'Third argument `tier` must be an integer between 0 and 5 inclusive';

    // Validate path
    if (!allPaths().includes(path)) throw 'Second argument `path` must be top-path, middle-path, or bottom-path';

    // Convert path + tier to appropriate upgrade string like 003 or 400
    const pathNum = allPaths().indexOf(path) + 1;
    const upgradeInt = tier * Math.pow(10, 3 - pathNum);
    const upgradeStr = upgradeInt.toString().padStart(3, '0');

    // Combine tower with upgrade string to get tower upgrade canonical like wizard#300
    return towerUpgradeToIndexNormalForm(`${tower}#${upgradeStr}`);
}

function upgradesFromPath(path) {
    return [1, 2, 3, 4, 5].map((tier) => upgradeFromPathAndTier(path, tier));
}

function upgradeFromPathAndTier(path, tier) {
    const entityPathIndex = allPaths().indexOf(path);
    return '0'.repeat(entityPathIndex) + `${tier}` + '0'.repeat(2 - entityPathIndex);
}

function pathTierFromUpgradeSet(upgradeSet) {
    const upgrades = upgradeSet.split('');
    let sortedUpgrades = [...upgrades].sort();
    const tier = sortedUpgrades[2];
    const path = allPaths()[upgrades.indexOf(tier)];
    return [path, tier];
}

function crossPathTierFromUpgradeSet(upgradeSet) {
    const paths = allPaths();
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

function allUpgradeCrosspathSets() {
    let result = new Set();
    for (let mainPath = 0; mainPath <= 5; ++mainPath) {
        for (let crossPath = 0; crossPath <= 2; ++crossPath) {
            result.add(`${mainPath}${crossPath}0`);
            result.add(`${mainPath}0${crossPath}`);
            result.add(`0${mainPath}${crossPath}`);
            result.add(`${crossPath}${mainPath}0`);
            result.add(`${crossPath}0${mainPath}`);
            result.add(`0${crossPath}${mainPath}`);
        }
    }
    return result;
}

/**
 * upgrade set is the "300" in "300 supermonkey"
 *
 * There are two modes: allowCrosspath=true (default) and allowCrosspath=false
 *
 * allowCrosspath=true, the default, is the usual stuff, you see in the game, i.e. "022", "012", "205" etc
 * allowCrosspath=false is different, it only accepts those that specifically point to an upgrade,
 * e.g. "100", "200", "500", "030", "004", but not "024"
 * In addition, allowCrosspath=false also accepts "222" to mean "base tower"
 *
 * @param {string} u upgradeSet
 * @param {boolean} allowCrosspath
 * @returns
 */
function isValidUpgradeSet(u, allowCrosspath = true) {
    if (!gHelper.is_str(u) || u.length !== 3) return false;

    if (isNaN(u)) return false;

    if (!allowCrosspath && u === '222') return true;

    // Get array of 3 digits, sorted in ascending order
    uSorted = u
        .split('')
        .map((c) => parseInt(c))
        .sort();

    if (uSorted[0] !== 0) return false; // you can only go with 2 upgrade paths at a time, so the smallest number has to be 0

    if (uSorted[1] > (allowCrosspath ? 2 : 0)) return false;

    if (uSorted[2] > 5) return false;

    return true;
}

/**
 * Function to test if a certain string is accepted as a (max) "temple sacrifice set".
 * Effectively 4 numbers representing which type of sacrifices were used.
 * e.g. 1110 if support was skipped, 1101 if magic was skipped, etc.
 * (When sacrificing towers to a Sun Temple, only 3 categories count)
 * (If four categories are sacrificed then the cheapest is ignored.)
 *
 * For the True Sun God which benefits from sacrifices in almost exactly the same way as a Temple:
 * a 1110 with all 4 tower types becomes a 2221, 1101 becomes 2212, etc.
 *
 * @param {string} str the temple sacrifice set string to be check if it is valid
 * @returns {boolean}
 */
function isValidTempleSet(str) {
    if (!gHelper.is_str) return false;
    let upgrades = [];
    if (str.includes('/')) {
        if (str.length !== 7) return false;
        upgrades = str.split('/');
    } else if (str.length !== 4) return false;
    else upgrades = str.split('');
    upgrades = upgrades.map((x) => parseInt(x)); // converts arr of string to arr of ints
    let sum = 0;
    upgrades.forEach((element) => {
        sum += element;
    }); // finds sum of elements
    if (isNaN(sum)) return false; // all strings will be yeeted out here, since the sum will be a NaN (summation may concatenate strings)
    if (sum > 7) return false; // stuff like 2222 gets thrown out
    upgrades.sort();
    if (upgrades[3] > 2) return false; // stuff with numbers greater than 2, like "3300" gets thrown out
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

    const subUpgrades = ['000'];
    for (subTier = 1; subTier <= tier; subTier++) {
        subUpgrades.push(upgradeFromPathAndTier(path, subTier));
    }
    for (subCrossTier = 1; subCrossTier <= crossTier; subCrossTier++) {
        subUpgrades.push(upgradeFromPathAndTier(crossPath, subCrossTier));
    }
    return subUpgrades;
}

function costOfTowerUpgrade(towerName, upgrade, difficulty, numDiscounts = 0, mkDiscounts = {}, battles2 = false) {
    let [path, tier] = pathTierFromUpgradeSet(upgrade);
    const costData = battles2 ? costs_b2 : costs;
    const tower = costData[towerName];
    const isBaseTower = upgrade === '000';
    let cost = isBaseTower ? tower.cost : tower.upgrades[path][`${tier}`];
    numDiscounts = tier <= 3 ? numDiscounts : 0;
    return bHelper.difficultyDiscountPriceMult(towerName, upgrade, cost, difficulty, numDiscounts, mkDiscounts);
}

function costOfTowerUpgradeSet(towerName, upgradeSet, difficulty, numDiscounts = 0, mkDiscounts = {}, battles2 = false) {
    const subUpgrades = subUpgradesFromUpgradeSet(upgradeSet);
    const [path, mainTier] = pathTierFromUpgradeSet(upgradeSet);
    const pathUpgrades = upgradesFromPath(path);
    const crossPathUpgrades = upgradesFromPath(crossPathTierFromUpgradeSet(upgradeSet)[0]);
    const primaryTowers = allPrimaryTowers();
    let totalCost = 0;
    subUpgrades.forEach((subUpgrade) => {
        const tier = pathTierFromUpgradeSet(subUpgrade)[1];
        if (primaryTowers.includes(towerName) && (
            (pathUpgrades.includes(subUpgrade) && tier >= "4") ||
            (crossPathUpgrades.includes(subUpgrade) && mainTier >= "3")
        )) {
            totalCost += costOfTowerUpgrade(towerName, subUpgrade, difficulty, numDiscounts, mkDiscounts, battles2);
        } else {
            if ("comeOnEverybody" in mkDiscounts) {
                let tmp = mkDiscounts.comeOnEverybody;
                mkDiscounts.comeOnEverybody = 0;
                totalCost += costOfTowerUpgrade(towerName, subUpgrade, difficulty, numDiscounts, mkDiscounts, battles2);
                mkDiscounts.comeOnEverybody = tmp;
            } else {
                totalCost += costOfTowerUpgrade(towerName, subUpgrade, difficulty, numDiscounts, mkDiscounts, battles2);
            }
        }
    });

    if (primaryTowers.includes(towerName) && mainTier !== "3" && mainTier !== "4" && "comeOnEverybody" in mkDiscounts) {
        mkDiscounts.comeOnEverybody = 0;
    }

    return totalCost;
}

function cumulativeTowerUpgradePathCosts(towerName, path, difficulty, numDiscounts = 0, battles2 = false) {
    let result = [0, 0, 0, 0, 0, 0];
    upgradesFromPath(path).forEach((upgrade, tier) => {
        result[tier + 1] += result[tier] + costOfTowerUpgrade(towerName, upgrade, difficulty, numDiscounts, {}, battles2);
    });
    return result;
}

module.exports = {
    towerUpgradeToTower,
    towerUpgradeToUpgrade,
    allPrimaryTowers,
    allMilitaryTowers,
    allMagicTowers,
    allSupportTowers,
    allTowerUpgrades,
    allTowers,
    allTowerPaths,
    allPaths,
    allTempleSets,
    isTowerUpgrade,
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
    allUpgradeCrosspathSets,
    isValidUpgradeSet,
    isValidTempleSet,
    formatEntity,
    getEntityType,
    costOfTowerUpgrade,
    costOfTowerUpgradeSet,
    cumulativeTowerUpgradePathCosts
};
