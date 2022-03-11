const IMPOPPABLE_ROUNDS = [6, 100];
const HARD_ROUNDS = [3, 80];
const MEDIUM_ROUNDS = [1, 60];
const EASY_ROUNDS = [1, 40];
const PREDET_ROUNDS = [1, 140]; // predetermined rounds
const PREDET_CHIMPS_ROUNDS = [6, 140];
const ALL_ROUNDS = [1, 1288555]; // will explain later

function getHealthRamping(r) {
    if (r <= 80) return 1;
    else if (r <= 100) return (r - 30) / 50;
    else if (r <= 124) return (r - 72) / 20;
    else if (r <= 150) return (3 * r - 320) / 20;
    else if (r <= 250) return (7 * r - 920) / 20;
    else if (r <= 300) return r - 208.5;
    else if (r <= 400) return (3 * r - 717) / 2;
    else if (r <= 500) return (5 * r - 1517) / 2;
    else return 5 * r - 2008.5;
}

function getSpeedRamping(r) {
    if (r <= 80) return 1;
    else if (r <= 100) return 1 + (r - 80) * 0.02;
    else if (r <= 150) return 1.6 + (r - 101) * 0.02;
    else if (r <= 200) return 3.0 + (r - 151) * 0.02;
    else if (r <= 250) return 4.5 + (r - 201) * 0.02;
    return 6.0 + (r - 252) * 0.02;
}

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
    /**
     * @summary returns back the multiplicative factor for health ramping
     * @param {int} round
     * @returns {int} multiplicative percentage increase
     */
    getHealthRamping,
    /**
     * @summary returns back the multiplicative factor for speed ramping
     * @param {int} round
     * @returns {int} multiplicative percentage increase
     */
    getSpeedRamping,

    difficultyPriceMult,
};
