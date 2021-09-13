pluralize = require('pluralize');

const DeveloperCommandError = require('../exceptions/developer-command-error.js');
const UserCommandError = require('../exceptions/user-command-error.js');

StringSetValuesParser = require('./string-set-values-parser.js');

const gHelper = require('../helpers/general.js');

class LimitedStringSetValuesParser {
    type() {
        return 'limited_string_set_value';
    }

    constructor(type, possibleValues, permittedValues = null) {
        this.supertype = type;
        this.possibleValues = possibleValues;
        this.permittedValues = permittedValues;

        if (!(this.possibleValues instanceof Array)) {
            throw new DeveloperCommandError(
                `Possible values "${this.possibleValues}" (first arg) must be an array`
            );
        }

        if (!gHelper.is_str(this.supertype)) {
            throw new DeveloperCommandError(
                `Type "${this.supertype}" (second arg) must be an string`
            );
        }

        if (this.permittedValues && !(this.permittedValues instanceof Array)) {
            throw new DeveloperCommandError(
                `Permitted values "${this.permittedValues}" (third arg) must be null or an array`
            );
        }

        // Ensure that the permitted values provided by the developer are a subset of all possible values
        if (this.permittedValues && this.permittedValues.length > 0) {
            for (let i = 0; i < this.permittedValues.length; i++) {
                if (
                    this.possibleValues &&
                    !this.possibleValues.includes(this.permittedValues[i])
                ) {
                    throw new DeveloperCommandError(
                        `${this.permittedValues[i]} is not a valid ${this.supertype}`
                    );
                }
            }
        } else {
            // Permitted values are set to all possible values if not provided
            this.permittedValues = [...this.possibleValues];
        }

        this.delegateParser = new StringSetValuesParser(
            ...this.permittedValues
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        try {
            return this.delegateParser.parse(arg);
        } catch (e) {
            if (e instanceof UserCommandError && this.errorMessage) {
                throw new UserCommandError(this.errorMessage(arg));
            } else throw e;
        }
    }

    errorMessage(badValue) {
        const NUM_EXAMPLE_VALUES = 3;

        const acceptedValues = gHelper.shuffle(this.permittedValues);

        const exampleValues = acceptedValues
            .slice(0, Math.min(acceptedValues.length, NUM_EXAMPLE_VALUES))
            .map((v) => {
                let aliases = Aliases.getAliasSet(v) || [v];
                return aliases[Math.floor(Math.random() * aliases.length)];
            });

        const etc = acceptedValues.length > NUM_EXAMPLE_VALUES ? ', etc. ' : '';

        let msg = '';
        msg += `\`${badValue}\` is neither an accepted ${this.supertype} nor a ${this.supertype} alias for this command. `;
        msg += `Valid examples include ${exampleValues
            .map((v) => `\`${v}\``)
            .join(', ')}${etc}. `;
        msg += `Use \`q!alias <proper_${this.supertype}_name>\` (i.e. \`q!alias ${exampleValues[0]}\`) `;
        msg += `to learn shorthands for various ${pluralize(this.supertype)}.`;
        return msg;
    }
}

module.exports = LimitedStringSetValuesParser;
