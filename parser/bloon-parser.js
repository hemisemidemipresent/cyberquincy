LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

module.exports = class BloonParser {
    type() {
        return 'bloon';
    }

    constructor(...permitted_bloons) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Aliases.allBloons(),
            permitted_bloons.map((d) => d.toLowerCase())
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
};
