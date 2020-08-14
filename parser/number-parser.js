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
        arg = Number(arg);
        // Validate arg
        if (isNaN(arg)) {
            throw new UserCommandError(`Expected number but got \`${arg}\``);
        }

        // Ensure arg is within bounds
        if (arg < this.low || arg > this.high) {
            throw new UserCommandError(`\`${arg}\` must be between ${this.low} and ${this.high} inclusive`);
        }

        return arg;
    }
}