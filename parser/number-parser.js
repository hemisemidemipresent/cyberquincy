module.exports = class NumberParser {
    type() {
        return "number";
    }

    // Takes in a lower and upper bound
    constructor(low, high) {
        this.low = low;
        this.high = high;

        this.validateValues()
    }

    validateValues() {
        // Lower bound of infinity ensures that there IS no lower bound
        if (!this.low) {
            low = -Infinity;
        }

        if (!this.high) {
            high = Infinity;
        }

        // Validate bounds
        if (isNaN(this.low)) {
            throw new DeveloperCommandError(`\`<low>\` must be a number but was instead given "${low}"`)
        }

        if (isNaN(this.high)) {
            throw new DeveloperCommandError(`\`<high>\` must be a number but was instead given "${low}"`)
        }
    }

    parse(arg) {
        const n = Number(arg);
        // Validate arg
        if (isNaN(n)) {
            throw new UserCommandError(`Expected number but got \`${arg}\``);
        }

        // Ensure arg is within bounds
        if (n < this.low || n > this.high) {
            throw new UserCommandError(`\`${n}\` must be between ${this.low} and ${this.high} inclusive`);
        }

        return n;
    }
}