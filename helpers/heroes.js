// God tier reference: https://www.reddit.com/r/btd6/comments/eh47t8/how_hero_xp_works_in_game_v20/

const gHelper = require('../helpers/general.js');

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

LEVELING_MODIFIERS = {
    ADORA: 1.71,
    BENJAMIN: 1.5,
    BRICKELL: 1.425,
    CHURCHILL: 1.71,
    ETIENNE: 1,
    EZILI: 1.425,
    GWEN: 1,
    JONES: 1,
    OBYN: 1,
    PAT: 1.425,
    QUINCY: 1,
    SAUDA: 1.425
};

LEVELING_MAP_DIFFICULTY_MODIFIERS = {
    BEGINNER: 1,
    INTERMEDIATE: 1.1,
    ADVANCED: 1.2,
    EXPERT: 1.3,
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
    heroSpecificLevelingMultiplier = LEVELING_MODIFIERS[hero.toUpperCase()];
    acc = 0;
    return BASE_XP_TO_GET_LEVEL.map((bxp) => {
        return bxp == null
            ? null
            : (acc = acc + Math.ceil(bxp * heroSpecificLevelingMultiplier));
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

module.exports = {
    levelingCurve,
    levelingChart,
};
