// Parses a regular expression!
class RegexParser {
    type() {
        return 'regex';
    }

    constructor(regex) {
        // Validate that the regex to match against is valid
        if (!(regex instanceof RegExp)) {
            throw new DeveloperCommandError(
                `"${regex}" is not a regular expression`
            );
        }

        this.regex = regex;
    }

    parse(arg) {
        // Try to match
        let match = arg.match(this.regex);

        // Test the match
        if (match) {
            return match[0];
        } else {
            throw new UserCommandError(
                `"${arg}" does not match against the regular expression "${this.regex}"`
            );
        }
    }
}

module.exports = RegexParser;
