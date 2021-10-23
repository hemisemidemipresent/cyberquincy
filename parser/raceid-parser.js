LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

class RaceParser {
    type() {
        return 'race';
    }

    constructor() {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Aliases.allRaces(),
            Aliases.allRaces()
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}

module.exports = RaceParser;
