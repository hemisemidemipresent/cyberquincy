function isValidUpgradeSet(u) {
    if (!h.is_str(u) || u.length !== 3) return false;

    if (isNaN(u)) return false;

    // Get array of 3 digits, sorted in ascending order
    uSorted = u.split('').map(c => parseInt(c)).sort()

    if (uSorted[0] !== 0) return false;

    if (uSorted[1] > 2) return false;

    if (uSorted[2] > 5) return false;

    return true;
}

module.exports = {
    isValidUpgradeSet,
}