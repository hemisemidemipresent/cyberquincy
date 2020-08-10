module.exports = class NumberParser {
    type() {
        return "number";
    }

    constructor(low, high) {
        this.low = low;
        this.high = high;

        this.validateValues()
    }

    validateValues() {
        if (!this.low) {
            low = -Infinity;
        }

        if (!this.high) {
            high = Infinity;
        }

        if (isNaN(this.low)) {
            throw new DeveloperCommandError(`\`<low>\` must be a number but was instead given "${low}"`)
        }

        if (isNaN(this.high)) {
            throw new DeveloperCommandError(`\`<high>\` must be a number but was instead given "${low}"`)
        }
    }

    parse(arg) {
        arg = Number(arg);
        if (isNaN(arg)) {
            throw new UserCommandError(`Expected number but got \`${arg}\``);
        }

        if (arg < this.low || arg > this.high) {
            throw new UserCommandError(`\`${arg}\` must be between ${this.low} and ${this.high} inclusive`);
        }

        return arg;
    }
}