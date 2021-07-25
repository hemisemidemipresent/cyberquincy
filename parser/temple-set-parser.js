LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

class TempleSetParser {
    type() {
        return 'temple_set';
    }

    constructor(...permittedValues) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Towers.allTempleSets(),
            permittedValues.map((pv) => pv.toLowerCase())
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}

module.exports = TempleSetParser;
