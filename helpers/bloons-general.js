const PRICE_MULTS = {
    'easy': 0.85,
    'medium': 1,
    'hard': 1.08,
    'impoppable': 1.2,
}

function difficultyPriceMult(mediumCost, difficulty) {
    // The game rounds up if mediumCost * PRICE_MULTS[difficulty] ends in 7.5 and down if it ends in 2.5
    let round = (mediumCost * PRICE_MULTS[difficulty] * 10) % 100 == 25 ? Math.floor : Math.round;
    return round((mediumCost * PRICE_MULTS[difficulty]) / 5) * 5;
}