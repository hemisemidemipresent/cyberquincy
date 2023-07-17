const PRICE_MULTS = {
    easy: 0.85,
    medium: 1,
    hard: 1.08,
    impoppable: 1.2
};

NUM_DISCOUNTS_TO_FACTOR = {
    0: 1,
    1: 0.85,
    2: 0.8,
    3: 0.75
};

class DiscountError extends Error {}

function rawDifficultyMult(mediumCost, difficulty) {
    const difficultyMultiplier = PRICE_MULTS[difficulty];
    if (!difficultyMultiplier) {
        throw `${difficulty} not a valid difficulty`;
    }
    return mediumCost * difficultyMultiplier;
}

function difficultyDiscountPriceMult(mediumCost, difficulty, numDiscounts, baseTower = false) {
    const discountFactor = NUM_DISCOUNTS_TO_FACTOR[numDiscounts];
    if (!discountFactor) {
        throw new DiscountError(`Cannot apply ${numDiscounts} discounts (must be between 0 and 3)`);
    }
    const unroundedCost = rawDifficultyMult(mediumCost, difficulty) * discountFactor;
    if (baseTower) return specialRound(unroundedCost);
    return Math.round(unroundedCost / 5) * 5;
}

// for base tower costs only
// it rounds to the nearest 5, but at exactly 2.5 it rounds down and at exactly 7.5 it rounds up
function specialRound(c) {
    const quotient = Math.floor(c / 10) * 10;
    let remainder = c % 10;
    let rounded = remainder === 2.5 ? 0 : 5 * Math.round(remainder / 5);
    return quotient + rounded;
}
module.exports = {
    rawDifficultyMult,
    difficultyDiscountPriceMult,
    DiscountError
};
