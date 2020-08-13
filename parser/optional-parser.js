const OptionalParserError = require('../exceptions/optional-parser-error.js');

module.exports = class OptionalParser {
    constructor(parser, defaultValue) {
        this.parser = parser;
        try {
            this.parser.parse(defaultValue)
        } catch(e) {
            throw new DeveloperCommandError(`Default value "${defaultValue}" for OptionalParser<${this.parser.constructor.name}> is invalid`);
        }
        this.defaultValue = defaultValue
    }

    type() {
        return this.parser.type();
    }

    parse(arg) {
        throw `Must not parse directly from the Optional Parser. Try parsing using the nested parser \`${this.parser.constructor.name}\` instead`
    }
}