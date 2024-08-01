// God tier reference: https://www.reddit.com/r/btd6/comments/eh47t8/how_hero_xp_works_in_game_v20/

const gHelper = require('../helpers/general.js');
const bHelper = require('./bloons-general');
const heroes = require('../jsons/heroes.json');
const gerrysShop = require('../jsons/geraldos_shop.json');

BASE_XP_TO_GET_LEVEL = [
    null, // Slot for non-existent level-0
    0,
    180,
    460,
    1000,
    1860,
    3280,
    5180,
    8320,
    9380,
    13620,
    16380,
    14400,
    16650,
    14940,
    16380,
    17820,
    19260,
    20700,
    16470,
    17280,
];

LEVELING_MAP_DIFFICULTY_MODIFIERS = {
    BEGINNER: 1,
    INTERMEDIATE: 1.1,
    ADVANCED: 1.2,
    EXPERT: 1.3,
};

function accumulatedXpCurve(
    startingRound,
    mapDifficulty,
    energizerAcquiredRound,
    mk
) {
    mapSpecificLevelingMultiplier =
        LEVELING_MAP_DIFFICULTY_MODIFIERS[mapDifficulty.toUpperCase()];

    xpGains = [];
    for (round = 0; round < 100; round++) {
        if (round == 0) {
            baseXpGainGain = 0;
        } else if (round == 1) {
            baseXpGainGain += 40;
        } else if (round <= 20) {
            baseXpGainGain += 20;
        } else if (round <= 50) {
            baseXpGainGain += 40;
        } else {
            baseXpGainGain += 90;
        }

        energizerFactor = round >= energizerAcquiredRound ? 1.5 : 1;
        mkFactor = mk ? 1.1 * 1.05 * 1.08 : 1;

        if (round == startingRound - 1) {
            xpGains.push(0);
        } else if (round < startingRound) {
            xpGains.push(null);
        } else {
            xpGains.push(
                baseXpGainGain * mapSpecificLevelingMultiplier * energizerFactor * mkFactor
            );
        }
    }

    acc = 0;
    return xpGains.map((xpGain) =>
        xpGain == null ? null : (acc = acc + xpGain)
    );
}
/**
 * Returns an array as to how much xp a hero must get (cumulatively) to reach a certain level
 * e.g. returned_arr = [null, 0, 9, 180, 640, 1640, 3500, 6780, ...] 
 * means that you can find the cumulative xp needed to reach level n by simply doing returned_arr[n]
 * @param {string} hero 
 * @returns {Array[int]}
 */
function heroLevelXpRequirements(hero) {
    heroSpecificLevelingMultiplier = heroes[hero]['levelModifier'];
    if (!heroSpecificLevelingMultiplier) throw `${hero} does not have "levelModifier" entry in heroes.json`;
    acc = 0;
    return BASE_XP_TO_GET_LEVEL.map((bxp) => {
        return bxp == null
            ? null
            : (acc = acc + Math.round(bxp * heroSpecificLevelingMultiplier));
        //: (acc = acc + Math.ceil(bxp * heroSpecificLevelingMultiplier));
    });
}

function levelingChart(hero, startingRound, mapDifficulty, mk) {
    heroXpGains = heroLevelXpRequirements(hero);
    accumulatedXp = accumulatedXpCurve(
        startingRound, 
        mapDifficulty, 
        Infinity, // no energizer
        mk
    );

    return [null].concat(
        accumulatedXp.map((axp) => {
            if (axp == null) return null;

            return heroXpGains.map((txp) => (txp == null ? null : txp - axp));
        })
    );
}
/**
 * Returns an array as to which round a hero will reach which level
 * e.g. returned_arr = [null, 7, 9, 11, 14, 19, ...] 
 * means that you can find the round a hero will reach level n by simply doing returned_arr[n]
 * @param {string} hero 
 * @param {int} startingRound 
 * @param {string} mapDifficulty 
 * @param {int} energizerAcquiredRound 
 * @returns {Array[int]}
 */
function levelingCurve(
    hero,
    startingRound,
    mapDifficulty,
    energizerAcquiredRound = Infinity,
    mk = false
) {
    accumulatedXp = accumulatedXpCurve(
        startingRound,
        mapDifficulty,
        energizerAcquiredRound,
        mk
    );

    return heroLevelXpRequirements(hero).map((txp) => {
        if (txp == null) return null;

        acquiredRound =
            accumulatedXp.findIndex((axp) => {
                return axp == null ? false : axp - txp >= 0;
            }) + 1;

        // findIndex returns -1 if not found, so +1 is 0, which is falsy
        return acquiredRound
            ? acquiredRound
            : gHelper.numberAsCost(txp - accumulatedXp[99]);
    });
}

function costOfHero(hero, difficulty, numDiscounts, mk) {
    const mediumCost = heroes[hero].cost;
    if (!mediumCost) throw `${hero} does not have an entry in heroes.json`;
    return bHelper.heroDifficultyDiscountPriceMult(mediumCost, difficulty, numDiscounts, mk);
}

function costOfGerryShopItem(item, difficulty) {
    const mediumCost = gerrysShop[item];
    if (!mediumCost) throw `${item} does not have an entry in geraldos_shop.json`;
    return bHelper.roundEven5(bHelper.rawDifficultyMult(mediumCost, difficulty));
}

function isHero(candidate) {
    if (!candidate || !gHelper.is_str(candidate)) return false;
    return allHeroes().includes(candidate.toLowerCase());
}

function allHeroes() {
    const heroes = Aliases.getAliasGroupsFromSameFileAs('EZILI');

    return heroes.map((ag) => ag.canonical);
}

function isGerrysShopItem(candidate) {
    if (!candidate || !gHelper.is_str(candidate)) return false;
    return allGerrysShopItems().includes(candidate.toLowerCase());
}

function allGerrysShopItems() {
    const items = Aliases.getAliasGroupsFromSameFileAs('FERTILIZER');

    return items.map((ag) => ag.canonical);
}

module.exports = {
    levelingCurve,
    levelingChart,
    costOfHero,
    costOfGerryShopItem,
    isHero,
    allHeroes,
    allGerrysShopItems,
    isGerrysShopItem,
};
