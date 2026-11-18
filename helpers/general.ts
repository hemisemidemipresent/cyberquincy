function is_str(s: unknown): s is string {
    return typeof s === 'string' || s instanceof String;
}

function numberWithCommas(x: number | string): string {
    let [ones, decimals] = x.toString().split('.');
    ones = ones.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    return decimals ? `${ones}.${decimals}` : ones;
}

function numberAsCost(x: number): string {
    return '$' + numberWithCommas(round(x, 1)); // rounding prevents excessive decimal points
}

/** Inclusive on both ends: range(1, 3) => [1, 2, 3] */
function range(start: number, end: number): number[] {
    return Array(end - start + 1)
        .fill(0)
        .map((_, idx) => start + idx);
}

function toTitleCase(str: string): string {
    str = str.toLowerCase();

    for (const separator of [' ', '-']) {
        str = str
            .split(separator)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(separator);
    }
    return str;
}

/**
 * Finds the integer in [low, high] where increasing `f` crosses 0,
 * returning Infinity/-Infinity if `f` stays below/above 0 throughout
 */
function binaryLambdaSearch(low: number, high: number, f: (n: number) => number): number {
    // A loop rather than recursion: when high = low + 1 the midpoint is low, so recursing on [mid, high] would never end
    // (and Bun's tail calls turn that into a hang rather than a stack overflow)
    while (true) {
        const mid = Math.floor((low + high) / 2);
        const n = f(mid);

        if (n == 0) return mid;
        if (n < 0 && f(mid + 1) > 0) return mid;
        if (n < 0) {
            if (low == high) return Infinity;
            low = mid == low ? high : mid;
        } else if (n > 0) {
            if (low == high) return -Infinity;
            high = mid;
        } else {
            return undefined; // f returned NaN
        }
    }
}

function round(num: number, numDigitsAfterDecimal = 0): number {
    return Math.round(num * 10 ** numDigitsAfterDecimal) / 10 ** numDigitsAfterDecimal;
}

/** Splits `arr` into `num` consecutive parts whose sizes differ by at most 1 */
function partition<T>(arr: T[], num: number): T[][] {
    const partitions: T[][] = [];
    for (let p = 0; p < num; p++) {
        const lowerLimit = Math.ceil((arr.length / num) * p);
        const upperLimit = Math.ceil((arr.length / num) * (p + 1));
        partitions.push(arr.slice(lowerLimit, upperLimit));
    }
    return partitions;
}

const WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);
const RED_X = String.fromCharCode(10060);

export {
    is_str,
    numberWithCommas,
    numberAsCost,
    range,
    toTitleCase,
    binaryLambdaSearch,
    round,
    partition,
    WHITE_HEAVY_CHECK_MARK,
    RED_X
};
