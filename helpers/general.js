function is_str(s) {
    return typeof s === 'string' || s instanceof String;
}

function is_fn(f) {
    return f && {}.toString.call(f) === '[object Function]';
}

function numberWithCommas(x) {
    let [ones, decimals] = x.toString().split('.');
    ones = ones.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    return decimals ? `${ones}.${decimals}` : ones;
}

function numberAsCost(x) {
    x = round(x, 1); // prevents excessive decimal points
    let commas = numberWithCommas(x);
    if (x.toString().startsWith('$')) return commas;

    return '$' + commas;
}

function randomIntegerFromInclusiveRange(low, high) {
    rangeInclusive = high - low + 1;

    return Math.floor(Math.random() * rangeInclusive) + low;
}

function allLengthNPermutations(inputArr) {
    let result = [];

    const permute = function (arr, m = []) {
        if (arr.length === 0) {
            result.push(m);
        } else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice();
                let next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next));
            }
        }
    };

    permute(inputArr);

    return result;
}

// [1, 2, 3], 5 => [null, null, 1, 2, 3], [null, 1, null, 2, 3], [null, 1, 2, null, 3], [null, 1, 2, 3, null], [1, null, null, 2, 3], etc.
function permutatePaddings(arr, newLength) {
    const numPads = newLength - arr.length;

    if (numPads <= 0) return [arr];

    let results = [];

    for (let i = 0; i < arr.length + 1; i++) {
        endArr = arr.slice(i);
        const recursiveResults = permutatePaddings(endArr, endArr.length + numPads - 1);
        for (let j = 0; j < recursiveResults.length; j++) {
            results.push(arr.slice(0, i).concat(null).concat(recursiveResults[j]));
        }
    }

    return results;
}

function shuffle(inputArr) {
    arr = [...inputArr];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

function range(start, end) {
    return Array(end - start + 1)
        .fill()
        .map((_, idx) => start + idx);
}

function toOrdinalSuffix(num) {
    const int = parseInt(num),
        digits = [int % 10, int % 100],
        ordinals = ['st', 'nd', 'rd', 'th'],
        oPattern = [1, 2, 3, 4],
        tPattern = [11, 12, 13, 14, 15, 16, 17, 18, 19];
    return oPattern.includes(digits[0]) && !tPattern.includes(digits[1]) ? int + ordinals[digits[0] - 1] : int + ordinals[3];
}

function fromOrdinalSuffix(ordinal) {
    m = ordinal.match(/(\d+)\w\w/i);
    if (m) return m[1];
    else throw 'Not an ordinal number';
}

function toTitleCase(str) {
    str = str.toLowerCase();

    separator_tokens = [' ', '-'];
    for (let i = 0; i < separator_tokens.length; i++) {
        str = str
            .split(separator_tokens[i])
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(separator_tokens[i]);
    }
    return str;
}

function zip(rows) {
    return rows[0].map((_, col) => rows.map((row) => row[col]));
}

function chunk(array, size) {
    const chunked_arr = [];
    let index = 0;
    while (index < array.length) {
        chunked_arr.push(array.slice(index, size + index));
        index += size;
    }
    return chunked_arr;
}

function arraysEqual(_arr1, _arr2) {
    if (!Array.isArray(_arr1) || !Array.isArray(_arr2) || _arr1.length !== _arr2.length) return false;

    let arr1 = _arr1.concat().sort();
    let arr2 = _arr2.concat().sort();

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }

    return true;
}

function binaryLambdaSearch(low, high, f) {
    mid = Math.floor((low + high) / 2);
    n = f(mid);

    if (n == 0) return mid;
    if (n < 0 && f(mid + 1) > 0) return mid;
    if (n < 0) {
        if (low == high) return Infinity;
        else return binaryLambdaSearch(mid, high, f);
    }
    if (n > 0) {
        if (low == high) return -Infinity;
        else return binaryLambdaSearch(low, mid, f);
    }
}

function addSpaces(str, max) {
    if (str == null || !str) {
        str = ' '.repeat(max);
        return str;
    }

    return str.padEnd(max);
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + ' days';
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + ' hours';
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + ' minutes';
    }
    return Math.floor(seconds) + ' seconds';
}

function round(num, numDigitsAfterDecimal = 0) {
    return Math.round(num * 10 ** numDigitsAfterDecimal) / 10 ** numDigitsAfterDecimal;
}

function mostCommonElement(arr) {
    if (arr.length == 0) return null;
    let modeMap = {};
    let maxEl = arr[0],
        maxCount = 1;
    for (let i = 0; i < arr.length; i++) {
        let el = arr[i];
        if (modeMap[el] == null) modeMap[el] = 1;
        else modeMap[el]++;
        if (modeMap[el] > maxCount) {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

function partition(arr, num) {
    const partitions = [];
    for (let p = 0; p < num; p++) {
        const lowerLimit = Math.ceil(arr.length / num * p);
        const upperLimit = Math.ceil(arr.length / num * (p + 1));
        const part = arr.slice(lowerLimit, upperLimit);
        partitions.push(part);
    }
    return partitions;
}

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);
RED_X = String.fromCharCode(10060);

module.exports = {
    is_str,
    is_fn,
    numberWithCommas,
    numberAsCost,
    randomIntegerFromInclusiveRange,
    allLengthNPermutations,
    permutatePaddings,
    shuffle,
    range,
    toOrdinalSuffix,
    fromOrdinalSuffix,
    toTitleCase,
    zip,
    chunk,
    arraysEqual,
    binaryLambdaSearch,
    addSpaces,
    timeSince,
    round,
    mostCommonElement,
    partition,
    HEAVY_CHECK_MARK,
    WHITE_HEAVY_CHECK_MARK,
    RED_X
};
