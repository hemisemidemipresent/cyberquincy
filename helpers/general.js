module.exports = {
    is_str(s) {
        return typeof s === 'string' || s instanceof String
    },

    randomIntegerFromInclusiveRange(low, high) {
        rangeInclusive = high - low + 1

        return Math.floor(Math.random() * rangeInclusive) + low
    }
}
