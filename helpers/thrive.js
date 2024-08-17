const regIncomes = require('../jsons/round_sets/regular.json');
const abrIncomes = require('../jsons/round_sets/abr.json');

const THRIVE_MULTIPLIER = 0.25;

function getIncomeData(roundSet) {
    let incomes;
    switch (roundSet) {
        case "abr":
            incomes = abrIncomes;
            break;
        default:
            incomes = regIncomes;
    }
    return incomes.map((round, ind) => (round.cashThisRound - 100 - ind) * THRIVE_MULTIPLIER);
}

function getRoundThriveIncome(round, roundSet = "regular") {
    let incomeData = getIncomeData(roundSet);
    return incomeData[round];
}

function getOptimalThrives(start, end, thrives, roundSet = "regular") {
    let incomeData = getIncomeData(roundSet);
    let dp = new Array(thrives);
    let totalRounds = end - start + 1;
    for (let i = 0; i < thrives; i++) {
        dp[i] = new Array(totalRounds - 2 * (thrives - i - 1));
        for (let j = 0; j < totalRounds - 2 * (thrives - i - 1); j++) {
            if (j <= 2 * i + 1) {
                let totalIncome = incomeData.reduce(
                    (a, b, ind) => (ind >= start && ind <= start + j) ? a + b : a, 0
                );
                let thriveRounds = Array(Math.floor(j / 2) + 1).fill().map((_, ind) => start + 2 * ind);
                dp[i][j] = [totalIncome, thriveRounds];
            } else if (i === 0) {
                let a = dp[i][j - 1];
                let b = (incomeData[start + j - 1] + incomeData[start + j]);
                dp[i][j] = (a[0] >= b ? a : [b, [start + j - 1]]);
            } else {
                let a = dp[i][j - 1];
                let b = dp[i - 1][j - 2];
                let c = b[0] + (incomeData[start + j - 1] + incomeData[start + j]);
                dp[i][j] = (a[0] >= c ? a : [c, b[1].concat([start + j - 1])]);
            }
        }
    }
    return dp[thrives - 1];
}

module.exports = {
    THRIVE_MULTIPLIER,
    getRoundThriveIncome,
    getOptimalThrives
};