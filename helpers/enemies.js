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

function allBloons() {
    const bloons = Aliases.getAliasGroupsFromSameFileAs('RED')
    return bloons.map((ag) => ag.canonical);
}

function allMOABs() {
    const moabs = Aliases.getAliasGroupsFromSameFileAs('MOAB')
    return moabs.map((ag) => ag.canonical);
}

function allEnemies() {
    const enemies = Aliases.getAliasGroupsFromSameImmediateDirectoryAs('RED');
    return enemies.map((ag) => ag.canonical);
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

    allBloons,
    allMOABs,
    allEnemies,
}