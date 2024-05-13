const mkMiscDiscounts = require('../jsons/mk/discounts.json').misc_discounts;

const PRICE_MULTS = {
    easy: 0.85,
    medium: 1,
    hard: 1.08,
    impoppable: 1.2
};

const NUM_DISCOUNTS_TO_FACTOR = {
    0: 0,
    1: 0.15,
    2: 0.2,
    3: 0.25
};

class DiscountError extends Error { }

// Rounds to the nearest 5, but rounds to the nearest 10 when equidistant
function roundEven5(num) {
    if (num % 5 === 2.5) return Math.round(num / 10) * 10;
    return Math.round(num / 5) * 5;
}

function rawDifficultyMult(mediumCost, difficulty) {
    const difficultyMultiplier = PRICE_MULTS[difficulty];
    if (!difficultyMultiplier) {
        throw `${difficulty} not a valid difficulty`;
    }
    return mediumCost * difficultyMultiplier;
}

function difficultyDiscountPriceMult(towerName, upgrade, mediumCost, difficulty, numDiscounts = 0, mkDiscounts = {}) {
    if (!(numDiscounts in NUM_DISCOUNTS_TO_FACTOR)) {
        throw new DiscountError(`Cannot apply ${numDiscounts} discounts (must be between 0 and 3)`);
    }
    cost = rawDifficultyMult(mediumCost, difficulty);
    if (upgrade !== "000") cost = Math.floor(cost);

    let absoluteDiscount = 0;
    let percentageDiscount = NUM_DISCOUNTS_TO_FACTOR[numDiscounts];
    percentageDiscount += mkDiscounts && numDiscounts ? mkMiscDiscounts.insider_trades : 0;
    if ("comeOnEverybody" in mkDiscounts && mkDiscounts.comeOnEverybody > 0) {
        percentageDiscount += mkDiscounts.comeOnEverybody;
    }
    if ("discounts" in mkDiscounts) {
        for (let discountGroup of mkDiscounts.discounts) {
            const upgrades = discountGroup.upgrades;
            const discount = discountGroup.discount;
            const uses = discountGroup.uses;
            for (const tower in upgrades) {
                if (tower === towerName && upgrades[tower].includes(upgrade) && uses !== 0) {
                    if (uses > 0) discountGroup.uses--;

                    if (discount < 0) {
                        absoluteDiscount += discount;
                    } else {
                        if (discountGroup.applied_absolute) {
                            absoluteDiscount += -Math.floor(discount * cost);
                        } else {
                            percentageDiscount += discount;
                        }
                    }
                }
            }
            if ((cost + absoluteDiscount) * (1 - percentageDiscount) <= 0) return 0;
        }
    }
    cost = (cost + absoluteDiscount) * (1 - percentageDiscount);
    return roundEven5(cost);
}

function heroDifficultyDiscountPriceMult(mediumCost, difficulty, numDiscounts = 0, mk = false) {
    if (!(numDiscounts in NUM_DISCOUNTS_TO_FACTOR)) {
        throw new DiscountError(`Cannot apply ${numDiscounts} discounts (must be between 0 and 3)`);
    }
    let percentageDiscount = NUM_DISCOUNTS_TO_FACTOR[numDiscounts];
    percentageDiscount += mk && numDiscounts ? mkMiscDiscounts.insider_trades : 0;
    percentageDiscount += mk ? mkMiscDiscounts.hero_favors : 0;
    let unroundedCost = rawDifficultyMult(mediumCost, difficulty);
    unroundedCost *= 1 - percentageDiscount;
    return roundEven5(unroundedCost);
}

module.exports = {
    roundEven5,
    rawDifficultyMult,
    difficultyDiscountPriceMult,
    heroDifficultyDiscountPriceMult,
    DiscountError
};
