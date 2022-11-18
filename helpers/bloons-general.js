const PRICE_MULTS = {
    'easy': 0.85,
    'medium': 1,
    'hard': 1.08,
    'impoppable': 1.2,
}

NUM_DISCOUNTS_TO_FACTOR = {
    0: 1,
    1: 0.85,
    2: 0.8,
    3: 0.75
}

class DiscountError extends Error {}

function difficultyDiscountPriceMult(mediumCost, difficulty, numDiscounts) {
    const difficultyMultiplier = PRICE_MULTS[difficulty]
    if (!difficultyMultiplier) {
        throw `${difficulty} not a valid difficulty`
    }

    const discountFactor = NUM_DISCOUNTS_TO_FACTOR[numDiscounts]
    if (!discountFactor) {
        throw new DiscountError(`Cannot apply ${numDiscounts} discounts (must be between 0 and 3)`)
    }
    const unroundedCost = mediumCost * difficultyMultiplier * discountFactor
    return Math.round(unroundedCost / 5) * 5;
}

module.exports = {
    difficultyDiscountPriceMult,
    DiscountError,
};
