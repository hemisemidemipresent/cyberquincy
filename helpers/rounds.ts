/** Inclusive range of rounds */
type RoundRange = readonly [low: number, high: number];

const PREDET_CHIMPS_ROUNDS: RoundRange = [6, 140];
const ALL_ROUNDS: RoundRange = [1, 1288555];

function isValidRound(r: number): boolean {
    return Number.isInteger(r) && r >= ALL_ROUNDS[0] && r <= ALL_ROUNDS[1];
}

/** The fraction of normal cash bloons give on round `r`, or an error message if `r` isn't a valid round */
function cashFactorForRound(r: number): number | string {
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
 * @param abr whether to read the ABR prefixes instead of the regular ones
 * @param bounds inclusive range of rounds to accept
 * @returns the round, or null if the token isn't a round within bounds
 */
function parseRound(token: string, abr = false, [low, high]: RoundRange = PREDET_CHIMPS_ROUNDS): number | null {
    const prefix = abr ? '(?:abr|a)' : '(?:round|r)';
    const match = token.match(new RegExp(`^${prefix}(\\d+)$`));
    if (!match) return null;

    const round = Number(match[1]);
    return round >= low && round <= high ? round : null;
}

export { PREDET_CHIMPS_ROUNDS, ALL_ROUNDS, isValidRound, cashFactorForRound, parseRound };
export type { RoundRange };
