const IMPOPPABLE_ROUNDS = [6, 100];
const HARD_ROUNDS = [3, 80];
const MEDIUM_ROUNDS = [1, 60];
const EASY_ROUNDS = [1, 40];
const PREDET_ROUNDS = [1, 140]; // predetermined rounds
const PREDET_CHIMPS_ROUNDS = [6, 140];
const ALL_ROUNDS = [1, 1288555]; // will explain later

const PRICE_MULTS = {
    'easy': 0.85,
    'medium': 1,
    'hard': 1.08,
    'impoppable': 1.2,
}

function difficultyPriceMult(mediumCost, difficulty) {
    return Math.round((mediumCost * PRICE_MULTS[difficulty]) / 5) * 5;
}

module.exports = {
    IMPOPPABLE_ROUNDS,
    HARD_ROUNDS,
    MEDIUM_ROUNDS,
    EASY_ROUNDS,
    PREDET_ROUNDS,
    PREDET_CHIMPS_ROUNDS,
    ALL_ROUNDS,

    difficultyPriceMult,
};
