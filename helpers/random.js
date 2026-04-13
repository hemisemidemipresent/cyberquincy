// NK's Seeded Random Number Generator
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 0x41a7) % 0x7FFFFFFF;
        return this.seed / 0x7FFFFFFE;
    }
}

function shuffle(array, seed) {
    const random = new SeededRandom(seed);
    const length = array.length - 1;
    for (let i = length; i >= 0; i--) {
        // Select random index in the array
        let index = Math.floor(length * random.next());
        // Swap elements of i and index
        temp = l[i];
        l[i] = l[index];
        l[index] = temp;
    }
}

// module.exports = SeededRandom;
module.exports = {
    SeededRandom,
    shuffle
};