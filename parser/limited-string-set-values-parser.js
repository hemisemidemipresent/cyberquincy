const DeveloperCommandError = require('../exceptions/developer-command-error.js');
const UserCommandError = require('../exceptions/user-command-error.js');

StringSetValuesParser = require('./string-set-values-parser.js');

module.exports = class LimitedStringSetValuesParser {
    type() {
        return 'limited_string_set_value';
    }

    constructor(possible_values, type, permitted_values=null, errorMessage=null) {
        if (!(possible_values instanceof Array)) {
            throw new DeveloperCommandError(`Possible values "${possible_values}" (first arg) must be an array`);
        }

        if (!(h.is_str(type))) {
            throw new DeveloperCommandError(`Type "${type}" (second arg) must be an string`);
        }

        if (permitted_values && !(permitted_values instanceof Array)) {
            throw new DeveloperCommandError(`Permitted values "${permitted_values}" (third arg) must be null or an array`);
        }

        if (!(h.is_fn(errorMessage))) {
            throw new DeveloperCommandError(`Error Message "${errorMessage}" (fourth arg) must be null or a function expecting one argument: a string that didn't match the ${type} parser`);
        }

        // Ensure that the permitted values provided by the developer are a subset of all possible values
        if (permitted_values && permitted_values.length > 0) {
            for (let i = 0; i < permitted_values.length; i++) {
                if (possible_values && !possible_values.includes(permitted_values[i])) {
                    throw new DeveloperCommandError(
                        `${permitted_values[i]} is not a valid ${type}`
                    );
                }
            }
        } else {
            // Permitted values are set to all possible values if not provided
            permitted_values = [...possible_values];
        }

        this.delegateParser = new StringSetValuesParser(
            ...permitted_values
        );

        this.errorMessage = errorMessage;
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        try {
            return this.delegateParser.parse(arg);
        } catch(e) {
            if (e instanceof UserCommandError && this.errorMessage) {
                throw new UserCommandError(this.errorMessage(arg))
            } else throw e;
        }
    }
};
