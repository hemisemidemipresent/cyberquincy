BASE_COST_TO_GET_LEVEL = [
    null,
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
]

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
}

LEVELING_MAP_DIFFICULTY_MODIFIERS = {
    BEGINNER: 1,
    INTERMEDIATE: 1.1,
    ADVANCED: 1.2,
    EXPERT: 1.3,
}

// Builds up an array for each level with elements representing rounds 0 to 100 inclusive
// starting with level 1, which is a special case, and moving from 2 all the way through 20.
// This needs to be done because the level 2 array depends on the level 1 array,
// the level 3 array depends on 2, etc.
//
// These calculations are super analogous to those in the BTD6 Index written in VBA
function levelingChart(hero, startingRound, mapDifficulty, engzRound=Infinity) {
    heroSpecificLevelingMultiplier =
        LEVELING_MODIFIERS[hero.toUpperCase()]
    mapSpecificLevelingMultiplier =
        LEVELING_MAP_DIFFICULTY_MODIFIERS[
            mapDifficulty.toUpperCase()
        ];

    roundVsLevelMatrix = [[]] // Level 0 instantiated
    roundVsLevelMatrix.push(
        fillLevel1CostArray(startingRound, mapSpecificLevelingMultiplier, engzRound)
    );

    for (level = 2; level <= 20; level++) {
        levelCostArray = [Infinity]; // round 0
        for (round = 1; round <= 100; round++) {
            totalCostToGetLevel =
                BASE_COST_TO_GET_LEVEL[level] *
                heroSpecificLevelingMultiplier

            levelCostArray.push(
                totalCostToGetLevel + roundVsLevelMatrix[level - 1][round]
            );
        }
        roundVsLevelMatrix.push(levelCostArray)
    }

    return roundVsLevelMatrix
}

function fillLevel1CostArray(startingRound, mapSpecificLevelingMultiplier, engzRound) {
    baseCost = null;
    if (startingRound <= 21) {
        baseCost = 10 * startingRound * startingRound + 10 * startingRound - 20;
    } else if (startingRound <= 51) {
        baseCost =
            20 * startingRound * startingRound - 400 * startingRound + 4180;
    } else {
        baseCost =
            45 * startingRound * startingRound - 2925 * startingRound + 67930;
    }

    level1CostArray = [Infinity]; // round 0
    level1CostArray.push(
        // round 1
        Math.floor(baseCost * mapSpecificLevelingMultiplier)
    );
    level1CostArray.push(
        //round 2
        Math.floor(level1CostArray[1] - 2 * 20 * mapSpecificLevelingMultiplier)
    );

    level1RoundGroupAddend = null;

    for (round = 3; round <= 100; round++) {
        if (round <= 21) {
            level1RoundGroupAddend = 20;
        } else if (round <= 51) {
            level1RoundGroupAddend = 40;
        } else {
            level1RoundGroupAddend = 90;
        }

        rm1 = level1CostArray[round - 1];
        rm2 = level1CostArray[round - 2];
        mapWeightedDifference = (rm2 - rm1) / mapSpecificLevelingMultiplier;

        level1CostArray.push(
            rm1 -
                (mapWeightedDifference + level1RoundGroupAddend) *
                    mapSpecificLevelingMultiplier
        );
    }

    return level1CostArray
}

module.exports = {
    levelingChart,
    levelingCurve,
}

function levelingCurve(hero, startingRound, mapDifficulty) {
    heroSpecificLevelingMultiplier = LEVELING_MODIFIERS[hero.toUpperCase()]
    total_xp_to_get_level = BASE_COST_TO_GET_LEVEL.map(bxp => Math.ceil(bxp * heroSpecificLevelingMultiplier))

    mapSpecificLevelingMultiplier =
        LEVELING_MAP_DIFFICULTY_MODIFIERS[
            mapDifficulty.toUpperCase()
        ]

    xpGains = []
    baseXpGainGain = 0
    for (round = 0; round < startingRound; round++) {
        xpGains.push(null)
    }
    for (round = startingRound; round <= 100; round++) {
        if (round == 1) {
            baseXpGainGain = 40
        } else if (round <= 20) {
            baseXpGainGain += 20
        } else if (round <= 50) {
            baseXpGainGain += 40
        } else {
            baseXpGainGain += 90
        }
        xpGains.push(
            baseXpGainGain * mapSpecificLevelingMultiplier
        )
    }

    acc = 0
    accumulatedXp = xpGains.map(xpGain => acc = acc + (xpGain || 0))

    console.log(total_xp_to_get_level)
    acc = 0
    console.log(total_xp_to_get_level.map(e => acc = acc + e))
    console.log(accumulatedXp)

    return total_xp_to_get_level.map(txp => {
        return accumulatedXp.findIndex(axp => txp - axp <= 0)
    })

    // // Create chart
    // return accumulatedXp.map(axp => {
    //     if (!axp) return null

    //     return total_xp_to_get_level.map(txp => {
    //         if (!txp) return null

    //         return txp - axp > 0 ? txp - axp : null
    //     })
    // })
}