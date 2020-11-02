LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

class TowerPathParser {
    type() {
        return 'tower_path';
    }

    constructor(...permittedValues) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Aliases.allTowers().map(t => {
                return [`${t}#top-path`, `${t}#middle-path`, `${t}#bottom-path`]
            }).flat(),
            permittedValues.map(pv => pv.toLowerCase())
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}

module.exports = TowerPathParser;
