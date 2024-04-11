const RegexParser = require('./regex-parser.js');
const gHelper = require('../helpers/general.js');

// Takes a list of values in the constructor
// If the arg equals any one of the provided values
// then the parsing succeeds.
class ExactStringParser {
    type() {
        return 'exact_string';
    }

    constructor(str) {
        this.str = str;

        // Disallow the case of no values
        if (!gHelper.is_str(this.str)) {
            throw new DeveloperCommandError(
                'Must provide an exact string to match against'
            );
        }

        let regex = new RegExp(`^${this.str}$`, 'i');
        this.delegateParser = new RegexParser(regex);
    }

    parse(arg) {
        try {
            return this.delegateParser.parse(arg);
        } catch (e) {
            // Catch the regex error and print out a more helpful error
            if (e instanceof UserCommandError) {
                throw new UserCommandError(
                    `"${arg}" is not equal to exact string \`${this.str}\``
                );
            } else {
                throw e;
            }
        }
    }
}

module.exports = ExactStringParser;
