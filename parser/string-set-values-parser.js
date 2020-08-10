const RegexParser = require('./regex-parser.js');

module.exports = class StringSetValuesParser {
    type() {
        return "string_set_value";
    }

    constructor(...values) {
        if (values.length === 0) {
            throw new DeveloperCommandError("Must provide at least one value");
        }

        for (var i = 0; i < values.length; i++) {
            if (!h.is_str(values[i])) {
                throw new DeveloperCommandError(`${values[i]} is not a string`)
            }
        }

        var regex = new RegExp('(' + values.join('|') + ')', 'i');
        this.delegateParser = new RegexParser(regex);
    }
    
    parse(arg) {
        try {
            return this.delegateParser.parse(arg);
        } catch(e) {
            if (e instanceof UserCommandError) {
                throw new UserCommandError(`"${arg}" is not one of available values: "${this.values.join(', ')}"`);
            } else {
                throw e;
            }
        }
    }
}