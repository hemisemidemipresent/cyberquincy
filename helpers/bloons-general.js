const PRICE_MULTS = {
    'easy': 0.85,
    'medium': 1,
    'hard': 1.08,
    'impoppable': 1.2,
}

function difficultyPriceMult(mediumCost, difficulty) {
    return Math.round((mediumCost * PRICE_MULTS[difficulty]) / 5) * 5;
}

NUM_DISCOUNTS_TO_FACTOR = {
    0: 1,
    1: 0.85,
    2: 0.8,
    3: 0.75
}

function discountPriceMult(cost, numDiscounts) {
    const discountFactor = NUM_DISCOUNTS_TO_FACTOR[numDiscounts]
    if (!discountFactor) {
        throw `Cannot apply ${numDiscounts} discounts (must be between 0 and 3)`
    }
    const unroundedDiscountPrice = cost * discountFactor

    // NK rounds 0.5 down so we must too, hence the 0.001
    return Math.round(unroundedDiscountPrice / 5 - 0.001) * 5;
}

module.exports = {
    difficultyPriceMult,
    discountPriceMult,
};
