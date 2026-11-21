import regIncomes from '../jsons/round_sets/regular.json';
import abrIncomes from '../jsons/round_sets/abr.json';

const THRIVE_MULTIPLIER = 0.25;

/** Total extra income and the rounds to thrive on to get it */
type ThrivePlan = [totalIncome: number, thriveRounds: number[]];

function getIncomeData(roundSet: string): number[] {
    const incomes = roundSet === 'abr' ? abrIncomes : regIncomes;
    return incomes.map((round, ind) => (round.cashThisRound - 100 - ind) * THRIVE_MULTIPLIER);
}

function getRoundThriveIncome(round: number, roundSet = 'regular'): number {
    return getIncomeData(roundSet)[round];
}

/** The best plan for using `thrives` thrives (each lasting 2 rounds) from round `start` to round `end` */
function getOptimalThrives(start: number, end: number, thrives: number, roundSet = 'regular'): ThrivePlan[] {
    const incomeData = getIncomeData(roundSet);
    const dp: ThrivePlan[][] = new Array(thrives);
    const totalRounds = end - start + 1;
    for (let i = 0; i < thrives; i++) {
        dp[i] = new Array(totalRounds - 2 * (thrives - i - 1));
        for (let j = 0; j < totalRounds - 2 * (thrives - i - 1); j++) {
            if (j <= 2 * i + 1) {
                const totalIncome = incomeData.reduce((a, b, ind) => (ind >= start && ind <= start + j ? a + b : a), 0);
                const thriveRounds = Array(Math.floor(j / 2) + 1)
                    .fill(0)
                    .map((_, ind) => start + 2 * ind);
                dp[i][j] = [totalIncome, thriveRounds];
            } else if (i === 0) {
                const a = dp[i][j - 1];
                const b = incomeData[start + j - 1] + incomeData[start + j];
                dp[i][j] = a[0] >= b ? a : [b, [start + j - 1]];
            } else {
                const a = dp[i][j - 1];
                const b = dp[i - 1][j - 2];
                const c = b[0] + (incomeData[start + j - 1] + incomeData[start + j]);
                dp[i][j] = a[0] >= c ? a : [c, b[1].concat([start + j - 1])];
            }
        }
    }
    return dp[thrives - 1];
}

export { getRoundThriveIncome, getOptimalThrives };
export type { ThrivePlan };
