const IMPOPPABLE_ROUNDS = [6, 100];
const HARD_ROUNDS = [3, 80];
const MEDIUM_ROUNDS = [1, 60];
const EASY_ROUNDS = [1, 40];
const PREDET_ROUNDS = [1, 140]; // predetermined rounds
const PREDET_CHIMPS_ROUNDS = [6, 140];
const ALL_ROUNDS = [1, 1288555];

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
        return 0.08;
    } else if (r <= 140) {
        return 0.05;
    } else {
        return 0.02;
    }
}

/**
 * Reads a round written as `r15`/`round15`, or `a15`/`abr15` for ABR rounds
 * @param {string} token
 * @param {boolean} abr whether to read the ABR prefixes instead of the regular ones
 * @param {[number, number]} bounds inclusive range of rounds to accept
 * @returns {number | null} the round, or null if the token isn't a round within bounds
 */
function parseRound(token, abr = false, [low, high] = PREDET_CHIMPS_ROUNDS) {
    const prefix = abr ? '(?:abr|a)' : '(?:round|r)';
    const match = token.match(new RegExp(`^${prefix}(\\d+)$`));
    if (!match) return null;

    const round = Number(match[1]);
    return round >= low && round <= high ? round : null;
}

/**
 *
 * @param {int} round the round number
 */
function roundBudget(round) {
    if (round > 100) return round * 4000 - 225000;
    let budget = round ** 7.7;
    let helper = round ** 1.75;
    if (round > 50) return budget * 5e-11 + helper + 20;
    return ((1 + round * 0.01) * (round * -3 + 400) * ((budget * 5e-11 + helper + 20) / 160) * 0.6);
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
    parseRound,
};