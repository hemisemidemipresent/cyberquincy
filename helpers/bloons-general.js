const PRICE_MULTS = {
    easy: 0.85,
    medium: 1,
    hard: 1.08,
    impoppable: 1.2
};

const NUM_DISCOUNTS_TO_FACTOR = {
    0: 0,
    1: 0.15,
    2: 0.2,
    3: 0.25
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
    if (!(numDiscounts in NUM_DISCOUNTS_TO_FACTOR)) {
        throw new DiscountError(`Cannot apply ${numDiscounts} discounts (must be between 0 and 3)`);
    }
    let percentageDiscount = NUM_DISCOUNTS_TO_FACTOR[numDiscounts];
    let unroundedCost = rawDifficultyMult(mediumCost, difficulty);
    if (!baseTower) unroundedCost = Math.floor(unroundedCost);
    unroundedCost *= 1 - percentageDiscount;
    return roundEven5(unroundedCost);
}

function heroDifficultyDiscountPriceMult(mediumCost, difficulty, numDiscounts) {
    if (!(numDiscounts in NUM_DISCOUNTS_TO_FACTOR)) {
        throw new DiscountError(`Cannot apply ${numDiscounts} discounts (must be between 0 and 3)`);
    }
    let percentageDiscount = NUM_DISCOUNTS_TO_FACTOR[numDiscounts];
    let unroundedCost = rawDifficultyMult(mediumCost, difficulty);
    unroundedCost *= 1 - percentageDiscount;
    return roundEven5(unroundedCost);
}

// Rounds to the nearest 5, but rounds to the nearest 10 when equidistant
function roundEven5 (num) {
    if (num % 10 === 2.5) return Math.floor(num / 5) * 5;
    return Math.round(num / 5) * 5;
}

module.exports = {
    rawDifficultyMult,
    difficultyDiscountPriceMult,
    heroDifficultyDiscountPriceMult,
    DiscountError
};
