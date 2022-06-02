const roundHelper = require('./rounds')

ENEMIES = [
    BLOONS = [
        RED = 'red',
        BLUE = 'blue',
        GREEN = 'green',
        YELLOW = 'yellow',
        PINK = 'pink',
        WHITE = 'white',
        BLACK = 'black',
        ZEBRA = 'zebra',
        LEAD = 'lead',
        RAINBOW = 'rainbow',
        CERAMIC = 'ceramic',
    ],
    MOABS = [
        MOAB = 'moab',
        BFB = 'bfb',
        ZOMG = 'zomg',
        DDT = 'ddt',
        BAD = 'bad',
    ]
].flat()

ENEMIES_THAT_CAN_BE_FORTIFIED = [LEAD, CERAMICS] + MOABS
ENEMIES_THAT_CAN_BE_SUPER = [
    WHITE, BLACK, ZEBRA, LEAD, RAINBOW, CERAMIC
]

function getHealthRamping(r) {
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

function getSpeedRamping(r) {
    if (r <= 80) return 1;
    else if (r <= 100) return 1 + (r - 80) * 0.02;
    else if (r <= 150) return 1.6 + (r - 101) * 0.02;
    else if (r <= 200) return 3.0 + (r - 151) * 0.02;
    else if (r <= 250) return 4.5 + (r - 201) * 0.02;
    return 6.0 + (r - 252) * 0.02;
}

function isValidEnemy(e) {
    return ENEMIES.includes(e)
}

function isBloon(b) {
    return BLOONS.includes(b)
}

function isMOAB(m) {
    return MOABS.includes(m)
}

function formatEnemy(e, formalName=false) {
    if (isBloon(e)) {
        let name = Aliases.toIndexNormalForm(e)
        if (formalName) name += " Bloon"
        return name
    } else if (isMOAB(e)) {
        return e.toUpperCase()
    } else {
        throw `${e} is not a bloon/moab`
    }
}

RED_BLOON_SECONDS_PER_SECOND = {
    red: 1,
    blue: 1.4,
    green: 1.8,
    yellow: 3.2,
    pink: 3.5,
    black: 1.8,
    white: 2,
    purple: 3,
    lead: 1,
    zebra: 1.8,
    rainbow: 2.2,
    ceramic: 2.5,
    moab: 1,
    bfb: 0.25,
    zomg: 0.18,
    ddt: 2.64,
    bad: 0.18,
}

LAYER_RBES = {
    fortified_lead: 4,
    ceramic: 10,
    super_ceramic: 60,
    moab: 200,
    bfb: 700,
    zomg: 4000,
    ddt: 400,
    bad: 20000,
}

function enemyChildren(enemy, round=80, fortified=false) {
    if (!isValidEnemy(enemy)) {
        throw `${enemy} is not a valid bloon/MOAB`
    }
    if (!roundHelper.isValidRound(round)) {
        throw `${round} is not a valid BTD6 round`
    }
    if (round > 80)
    switch(enemy) {
        case 'red':
            return Array(0)
        case 'blue':
            return Array(1).fill('red')
        case 'green':
            return Array(1).fill('blue')
        case 'yellow':
            return Array(1).fill('green')
        case 'pink':
            return Array(1).fill('yellow')
        case 'white':
            return Array(2).fill('pink')
        case 'black':
            return Array(2).fill('pink')
        case 'lead':
            return Array(2).fill('black')
        case 'zebra':
            return ['black', 'white']
        case 'rainbow':
            return Array(2).fill('zebra')
        case 'ceramic':
            return Array(2).fill('rainbow')
        case 'super_black':
            return Array(1).fill('pink')
        case 'super_lead':
            return Array(1).fill('black')
        case 'super_zebra':
            return Array(1).fill('super_black')
        case 'super_rainbow':
            return Array(1).fill('super_zebra')
        case 'super_ceramic':
            return Array(1).fill('rainbow')
        case 'moab': // same as ddt
        case 'ddt': // regrow children, but irrelevant
            if (round <= 80) {
                return Array(4).fill('ceramic')
            } else {
                return Array(4).fill('super_ceramic')
            }
        case 'bfb':
            return Array(4).fill('moab')
        case 'zomg':
            Array(4).fill('bfb')
        case 'bad':
            return Array(2).fill('zomg') + Array(3).fill('ddt')
    }
}

module.exports = {
    RED_BLOON_SECONDS_PER_SECOND,

    /**
     * @summary returns back the multiplicative factor for health ramping
     * @param {int} round
     * @returns {int} multiplicative percentage increase
     */
    getHealthRamping,
    /**
     * @summary returns back the multiplicative factor for speed ramping
     * @param {int} round
     * @returns {int} multiplicative percentage increase
     */
    getSpeedRamping,

    BLOONS, MOABS, ENEMIES,

    formatEnemy,

    enemyChildren,
}