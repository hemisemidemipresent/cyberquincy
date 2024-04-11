// A wrapper around another parser to signify that the corresponding argument is optional
class OptionalParser {
    // Takes in the concrete parser and a default value is the parser fails to parse
    constructor(parser, defaultValue=null) {
        this.parser = parser;
        // Default value must validate with the concrete parser itself
        // i.e. if `this.parser` is a DifficultyParser,
        // then defaultValue must be a valid difficulty
        try {
            if (defaultValue)
                this.parser.parse(defaultValue);
        } catch(e) {
            throw new DeveloperCommandError(`Default value "${defaultValue}" for OptionalParser<${this.parser.constructor.name}> is invalid`);
        }
        this.defaultValue = defaultValue;
    }

    // The optional parser type is the type of the concrete parser wrapped in parentheses
    // This notation indicates that the corresponding argument is optional
    type() {
        return 'optional';
    }

    parse() {
        throw `Must not parse directly from the Optional Parser. Try parsing using the nested parser \`${this.parser.constructor.name}\` instead`;
    }
}

module.exports = OptionalParser;
