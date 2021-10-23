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
     *
     * @param {int} round
     * @returns {int} percentage increase
     */
    getRamping(round) {
        if (round < 81) return 0;
        let r1 = 2,
            r2 = 5,
            r3 = 15;
        if (round < 101) return (round - 80) * r1;
        if (round < 125) return 20 * r1 + (round - 100) * r2;
        if (round < 152) return 20 * r1 + 24 * r2 + (round - 124) * r3;
        return 20 * r1 + 24 * r2 + 27 * r3 + (round - 151) * 35;
    },
};
