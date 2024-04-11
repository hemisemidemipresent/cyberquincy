const NumberParser = require('./number-parser.js');

// NumberParser with the added restriction that also must be a positive integer
// Great for round number and combo number for a particular spreadsheet
class NaturalNumberParser {
    type() {
        return 'natural_number';
    }

    // Takes in an upper and a lower bound
    constructor(low = 1, high = Infinity) {
        this.delegateParser = new NumberParser(low, high);
        this.validateValues(low, high);
    }

    validateValues(low, high) {
        if (!this.isNaturalNumber(low)) {
            throw new DeveloperCommandError(
                `\`low\` must be a counting number`
            );
        }

        if (high !== Infinity) {
            if (!this.isNaturalNumber(high)) {
                throw new DeveloperCommandError(
                    `\`high\` must be a counting number`
                );
            }
        }
    }

    isNaturalNumber(n) {
        return Number.isInteger(n) && n > 0;
    }

    parse(arg) {
        let result = this.delegateParser.parse(arg);
        if (!this.isNaturalNumber(result)) {
            throw new UserCommandError(
                `Argument must be a natural number but got \`${arg}\` instead`
            );
        }
        return result;
    }
}

module.exports = NaturalNumberParser;
