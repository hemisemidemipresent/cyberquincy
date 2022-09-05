const PRICE_MULTS = {
    easy: 0.85,
    medium: 1,
    hard: 1.08,
    impoppable: 1.2
};

function difficultyPriceMult(mediumCost, difficulty) {
    return Math.round((mediumCost * PRICE_MULTS[difficulty]) / 5) * 5;
}

module.exports = {
    difficultyPriceMult
};
