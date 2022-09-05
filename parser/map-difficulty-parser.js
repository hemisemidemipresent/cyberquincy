LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

class MapDifficultyParser {
    type() {
        return 'map_difficulty';
    }

    constructor(...permitted_map_difficulties) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Aliases.allMapDifficulties(),
            permitted_map_difficulties.map((d) => d.toLowerCase())
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}

module.exports = MapDifficultyParser;
