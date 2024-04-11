LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

class DifficultyParser {
    type() {
        return 'difficulty';
    }

    constructor(...permitted_difficulties) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Aliases.allDifficulties(),
            permitted_difficulties.map(d => d.toLowerCase()),
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}

module.exports = DifficultyParser;
