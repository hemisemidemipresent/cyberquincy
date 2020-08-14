// Parses a regular expression!
module.exports = class RegexParser {
    type() {
        return "regex";
    }

    constructor(regex) {
        // Validate that the regex to match against is valid
        if (!(regex instanceof RegExp)) {
            throw new DeveloperCommandError(`"${regex}" is not a regular expression`);
        }

        this.regex = regex
    }
    
    parse(arg) {
        // Try to match
        var match = arg.match(this.regex);

        // Test the match
        if (match) {
            return match[1];
        } else {
            throw new UserCommandError(`"${arg}" does not match against the regular expression "${this.regex}"`);
        }
    }
}