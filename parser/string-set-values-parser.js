const RegexParser = require('./regex-parser.js');
const gHelper = require('../helpers/general.js');

// Takes a list of values in the constructor
// If the arg equals any one of the provided values
// then the parsing succeeds.
class StringSetValuesParser {
    type() {
        return 'string_set_value';
    }

    constructor(...values) {
        // Disallow the case of no values
        if (values.length === 0) {
            throw new DeveloperCommandError('Must provide at least one value');
        }

        // values must be strings because they're matched against string args
        for (let i = 0; i < values.length; i++) {
            if (!gHelper.is_str(values[i])) {
                throw new DeveloperCommandError(`${values[i]} is not a string`);
            }
        }

        // Keep track of values for good error message
        this.values = values;

        // Construct a delegate parser for the list of permitted values
        // by ORing them together into a regular expression
        let regex = new RegExp('^(?:' + values.join('|') + ')$', 'i');
        this.delegateParser = new RegexParser(regex);
    }

    parse(arg) {
        try {
            return this.delegateParser.parse(arg);
        } catch (e) {
            // Catch the regex error and print out a more helpful error
            if (e instanceof UserCommandError) {
                let errorValues = null;
                if (this.values.length > 10) {
                    errorValues =
                        this.values
                            .slice(0, 5)
                            .map((v) => `\`${v}\``)
                            .join(', ') +
                        ', **...**,' +
                        this.values
                            .slice(-5)
                            .map((v) => `\`${v}\``)
                            .join(', ');
                } else {
                    errorValues = this.values.join(', ');
                }
                throw new UserCommandError(
                    `"${arg}" is not one of available values: ${errorValues}`
                );
            } else {
                throw e;
            }
        }
    }
}

module.exports = StringSetValuesParser;
