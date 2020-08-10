const OptionalParserError = require('../exceptions/optional-parser-error.js');

module.exports = class OptionalParser {
    constructor(parser, defaultValue) {
        this.parser = parser;
        this.defaultValue = defaultValue
    }

    type() {
        return this.parser.type();
    }

    parse(arg) {
        try {
            return this.parser.parse(arg);
        } catch(UserCommandError) {
            throw new OptionalParserError();
        }
    }
}