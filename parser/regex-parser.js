module.exports = class RegexParser {
    type() {
        return "regex";
    }

    constructor(regex) {
        if (!(regex instanceof RegExp)) {
            throw new DeveloperCommandError(`"${regex}" is not a regular expression`);
        }

        this.regex = regex
    }
    
    parse(arg) {
        var match = arg.match(this.regex);

        if (match) {
            return match[1];
        } else {
            throw new UserCommandError(this.mismatchErrorMessage());
        }
    }

    mismatchErrorMessage() {
        `"${arg}" does not fit the regular expression "${this.regex}"`
    }
}