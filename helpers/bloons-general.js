const IMPOPPABLE_ROUNDS = [6, 100];
const HARD_ROUNDS = [3, 80];
const MEDIUM_ROUNDS = [1, 60];
const EASY_ROUNDS = [1, 40];
const PREDET_ROUNDS = [1, 140]; // predetermined rounds
const PREDET_CHIMPS_ROUNDS = [6, 140];
const ALL_ROUNDS = [1, 1288555]; // will explain later

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
    getRamping(r) {
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
};
