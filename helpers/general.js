const IMPOPPABLE_ROUNDS = [6, 100];
const HARD_ROUNDS = [3, 80];
const MEDIUM_ROUNDS = [1, 60];
const EASY_ROUNDS = [1, 40];
const ALL_ROUNDS = [1, 100];

function is_str(s) {
    return typeof s === 'string' || s instanceof String;
}

function is_fn(f) {
    return f && {}.toString.call(f) === '[object Function]';
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function numberAsCost(x) {
    return '$' + module.exports.numberWithCommas(x);
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
    
    let results = []

    for (var i = 0; i < arr.length + 1; i++) {
        endArr = arr.slice(i)
        const recursiveResults = permutatePaddings(endArr, endArr.length + numPads - 1)
        for (var j = 0; j < recursiveResults.length; j++) {
            results.push(
                arr.slice(0, i).concat(null).concat(recursiveResults[j])
            )
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
    return oPattern.includes(digits[0]) && !tPattern.includes(digits[1])
        ? int + ordinals[digits[0] - 1]
        : int + ordinals[3];
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
    if (
        !Array.isArray(_arr1) ||
        !Array.isArray(_arr2) ||
        _arr1.length !== _arr2.length
    )
        return false;

    var arr1 = _arr1.concat().sort();
    var arr2 = _arr2.concat().sort();

    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }

    return true;
}

module.exports = {
    IMPOPPABLE_ROUNDS,
    HARD_ROUNDS,
    MEDIUM_ROUNDS,
    EASY_ROUNDS,
    ALL_ROUNDS,

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
    toTitleCase,
    zip,
    chunk,
    arraysEqual,
};
