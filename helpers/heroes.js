// God tier reference: https://www.reddit.com/r/btd6/comments/eh47t8/how_hero_xp_works_in_game_v20/

const gHelper = require('../helpers/general.js');
const heroes = require('../jsons/heroes.json')

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

const HERO_NAME_TO_BLOONOLOGY_LINK = {
    quincy: 'https://pastebin.com/raw/ASpHNduS',
    gwendolin: 'https://pastebin.com/raw/rZYjbEhX',
    striker_jones: 'https://pastebin.com/raw/hrH8q0bd',
    obyn_greenfoot: 'https://pastebin.com/raw/x2WiKEWi',
    captain_churchill: 'https://pastebin.com/raw/cqaHnhgB',
    benjamin: 'https://pastebin.com/raw/j6X3mazy',
    ezili: 'https://pastebin.com/raw/dYu1B9bp',
    pat_fusty: 'https://pastebin.com/raw/2YRMFjPG',
    adora: 'https://pastebin.com/raw/WnsgkWRc',
    admiral_brickell: 'https://pastebin.com/raw/amw39T29',
    etienne: 'https://pastebin.com/raw/UxN2Wx1F',
    sauda: 'https://pastebin.com/raw/8E2TSndk',
    psi: 'https://pastebin.com/raw/9h9aAPUm',
    geraldo: 'https://pastebin.com/raw/rksZWhTV',
};

function accumulatedXpCurve(
    startingRound,
    mapDifficulty,
    energizerAcquiredRound
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

        if (round == startingRound - 1) {
            xpGains.push(0);
        } else if (round < startingRound) {
            xpGains.push(null);
        } else {
            xpGains.push(
                baseXpGainGain * mapSpecificLevelingMultiplier * energizerFactor
            );
        }
    }

    acc = 0;
    return xpGains.map((xpGain) =>
        xpGain == null ? null : (acc = acc + xpGain)
    );
}

function heroLevelXpRequirements(hero) {
    heroSpecificLevelingMultiplier = heroes[hero]['levelModifier'];
    if (!heroSpecificLevelingMultiplier) throw `${hero} does not have "levelModifier" entry in heroes.json`
    acc = 0;
    return BASE_XP_TO_GET_LEVEL.map((bxp) => {
        return bxp == null
            ? null
            : (acc = acc + Math.round(bxp * heroSpecificLevelingMultiplier));
        //: (acc = acc + Math.ceil(bxp * heroSpecificLevelingMultiplier));
    });
}

function levelingChart(hero, startingRound, mapDifficulty) {
    heroXpGains = heroLevelXpRequirements(hero);
    accumulatedXp = accumulatedXpCurve(startingRound, mapDifficulty);

    return [null].concat(
        accumulatedXp.map((axp) => {
            if (axp == null) return null;

            return heroXpGains.map((txp) => (txp == null ? null : txp - axp));
        })
    );
}

function levelingCurve(
    hero,
    startingRound,
    mapDifficulty,
    energizerAcquiredRound = Infinity
) {
    accumulatedXp = accumulatedXpCurve(
        startingRound,
        mapDifficulty,
        energizerAcquiredRound
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
    HERO_NAME_TO_BLOONOLOGY_LINK,
    levelingCurve,
    levelingChart,
    isHero,
    allHeroes,
    allGerrysShopItems,
    isGerrysShopItem,
};
