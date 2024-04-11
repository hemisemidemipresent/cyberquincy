const IMPOPPABLE_ROUNDS = [6, 100];
const HARD_ROUNDS = [3, 80];
const MEDIUM_ROUNDS = [1, 60];
const EASY_ROUNDS = [1, 40];
const PREDET_ROUNDS = [1, 140]; // predetermined rounds
const PREDET_CHIMPS_ROUNDS = [6, 140];
const ALL_ROUNDS = [1, 1288555]; // will explain later

function isValidRound(r) {
    return Number.isInteger(r) && r >= ALL_ROUNDS[0] && r <= ALL_ROUNDS[1];
}

function cashFactorForRound(r) {
    if (!isValidRound(r)) {
        return `${r} is not a valid round`;
    }

    if (r <= 50) {
        return 1;
    } else if (r <= 60) {
        return 0.5;
    } else if (r <= 85) {
        return 0.2;
    } else if (r <= 100) {
        return 0.1;
    } else if (r <= 120) {
        return 0.05;
    } else {
        return 0.02;
    }
}

module.exports = {
    IMPOPPABLE_ROUNDS,
    HARD_ROUNDS,
    MEDIUM_ROUNDS,
    EASY_ROUNDS,
    PREDET_ROUNDS,
    PREDET_CHIMPS_ROUNDS,
    ALL_ROUNDS,

    isValidRound,
    cashFactorForRound,
};