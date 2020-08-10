const NumberParser = require('./number-parser.js');

module.exports = class NaturalNumberParser {
    type() { 
        return "natural_number";
    }

    constructor(low, high) {
        this.delegateParser = new NumberParser(low, high);
        this.validateValues(low, high);
    }
    
    validateValues(low, high) {
        if (!this.isNaturalNumber(low)) {
            throw new DeveloperCommandError(`\`low\` must be a counting number`);
        }

        if (high !== Infinity) {
            if (!this.isNaturalNumber(high)) {
                throw new DeveloperCommandError(`\`high\` must be a counting number`);
            }
        }
    }

    isNaturalNumber(n) {
        return Number.isInteger(n) && n > 0;
    }

    parse(arg) {
        var result = this.delegateParser.parse(arg);
        if (!this.isNaturalNumber(result)) {
            throw new UserCommandError(`Argument must be a natural number but got \`${arg}\` instead`);
        }
        return result;
    }
}