import mkDiscounts from '../jsons/mk/discounts.json';

import type { DifficultyCanonical } from '../types/aliases';

const mkMiscDiscounts = mkDiscounts.misc_discounts;

/** A Monkey Knowledge discount on specific tower upgrades, as listed in jsons/mk/discounts.json */
interface MonkeyKnowledgeTowerDiscount {
    /** {tower: upgrades the discount applies to} */
    upgrades: Record<string, string[]>;
    /** Negative: an absolute discount in cash. Positive: a fraction of the cost */
    discount: number;
    /** How many more times the discount can be applied; -1 for unlimited */
    uses: number;
    /** Whether a positive (fractional) discount is taken off the cost before the percentage discounts */
    applied_absolute?: boolean;
}

/**
 * The state of the price-affecting Monkey Knowledge across one calculation.
 * Use `null`/`undefined` (never `false` or `{}`) for no Monkey Knowledge.
 *
 * Costing functions mutate it: limited-use discounts are used up and Come On Everybody is turned off once applied,
 * so build a new one with `maxMonkeyKnowledge()` for every calculation.
 */
interface MonkeyKnowledgeModifiers {
    /** Come On Everybody's discount; 0 once it no longer applies */
    comeOnEverybody: number;
    discounts: MonkeyKnowledgeTowerDiscount[];
}

/** A fresh copy of every price-affecting Monkey Knowledge */
function maxMonkeyKnowledge(): MonkeyKnowledgeModifiers {
    return {
        comeOnEverybody: mkMiscDiscounts.come_on_everybody,
        discounts: structuredClone(mkDiscounts.tower_discounts)
    };
}

/** The same modifiers without Come On Everybody; discounts used up through either are used up in both */
function withoutComeOnEverybody(mk: MonkeyKnowledgeModifiers | null | undefined): MonkeyKnowledgeModifiers | null {
    return mk ? { ...mk, comeOnEverybody: 0 } : null;
}

const PRICE_MULTS: Record<DifficultyCanonical, number> = {
    easy: 0.15,
    medium: 0,
    hard: 0.08,
    impoppable: 0.2
};

const NUM_DISCOUNTS_TO_FACTOR: Record<number, number> = {
    0: 0,
    1: 0.15,
    2: 0.2,
    3: 0.25
};

class DiscountError extends Error {}

// Rounds to the nearest 5, but rounds to the nearest 10 when equidistant
function specialRound(num: number): number {
    const quotient = Math.floor(num / 5) * 5;
    const residual = num % 5;
    if (residual < 2.5) return quotient;
    else return quotient + 5;
}

function rawDifficultyMult(mediumCost: number, difficulty: DifficultyCanonical): number {
    const difficultyMultiplier = PRICE_MULTS[difficulty];
    if (!difficultyMultiplier && difficultyMultiplier !== 0) {
        throw `${difficulty} not a valid difficulty`;
    }
    if (difficulty == 'easy') {
        return mediumCost - Math.floor(mediumCost * difficultyMultiplier);
    }
    return mediumCost + Math.floor(mediumCost * difficultyMultiplier);
}

function difficultyDiscountPriceMult(
    towerName: string,
    upgrade: string,
    mediumCost: number,
    difficulty: DifficultyCanonical,
    numDiscounts = 0,
    mk: MonkeyKnowledgeModifiers | null = null
): number {
    if (!(numDiscounts in NUM_DISCOUNTS_TO_FACTOR)) {
        throw new DiscountError(`Cannot apply ${numDiscounts} discounts (must be between 0 and 3)`);
    }
    let cost = rawDifficultyMult(mediumCost, difficulty);
    if (upgrade !== '000') cost = Math.floor(cost);

    let absoluteDiscount = 0;
    let percentageDiscount = NUM_DISCOUNTS_TO_FACTOR[numDiscounts];
    if (!mk) return specialRound(cost * (1 - percentageDiscount));

    if (numDiscounts) percentageDiscount += mkMiscDiscounts.insider_trades;
    if (mk.comeOnEverybody > 0) percentageDiscount += mk.comeOnEverybody;

    for (const discountGroup of mk.discounts) {
        const { upgrades, discount, uses } = discountGroup;
        for (const tower in upgrades) {
            if (tower === towerName && upgrades[tower].includes(upgrade) && uses !== 0) {
                if (uses > 0) discountGroup.uses--;

                if (discount < 0) {
                    absoluteDiscount += discount;
                } else if (discountGroup.applied_absolute) {
                    absoluteDiscount += -Math.floor(discount * cost);
                } else {
                    percentageDiscount += discount;
                }
            }
        }
        if ((cost + absoluteDiscount) * (1 - percentageDiscount) <= 0) return 0;
    }
    return specialRound((cost + absoluteDiscount) * (1 - percentageDiscount));
}

function heroDifficultyDiscountPriceMult(
    mediumCost: number,
    difficulty: DifficultyCanonical,
    numDiscounts = 0,
    mk: MonkeyKnowledgeModifiers | null = null
): number {
    if (!(numDiscounts in NUM_DISCOUNTS_TO_FACTOR)) {
        throw new DiscountError(`Cannot apply ${numDiscounts} discounts (must be between 0 and 3)`);
    }
    let percentageDiscount = NUM_DISCOUNTS_TO_FACTOR[numDiscounts];
    if (mk) {
        if (numDiscounts) percentageDiscount += mkMiscDiscounts.insider_trades;
        percentageDiscount += mkMiscDiscounts.hero_favors;
    }
    return specialRound(rawDifficultyMult(mediumCost, difficulty) * (1 - percentageDiscount));
}

export {
    maxMonkeyKnowledge,
    withoutComeOnEverybody,
    specialRound,
    rawDifficultyMult,
    difficultyDiscountPriceMult,
    heroDifficultyDiscountPriceMult,
    DiscountError
};
export type { MonkeyKnowledgeModifiers, MonkeyKnowledgeTowerDiscount };
