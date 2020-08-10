module.exports = {
    is_str(s) {
        return typeof s === 'string' || s instanceof String;
    },

    randomIntegerFromInclusiveRange(low, high) {
        rangeInclusive = high - low + 1;

        return Math.floor(Math.random() * rangeInclusive) + low;
    },

    allLengthNPermutations(inputArr) {
        let result = [];
      
        const permute = function(arr, m = []) {
          if (arr.length === 0) {
            result.push(m)
          } else {
            for (let i = 0; i < arr.length; i++) {
              let curr = arr.slice();
              let next = curr.splice(i, 1);
              permute(curr.slice(), m.concat(next))
           }
         }
       }
      
       permute(inputArr)
      
       return result;
    },

    range(start, end) {
        return Array(end - start + 1).fill().map((_, idx) => start + idx)
    },

    IMPOPPABLE_ROUNDS: [6, 100],
    HARD_ROUNDS: [3, 80],
    MEDIUM_ROUNDS: [1, 60],
    EASY_ROUNDS: [1, 40],
}