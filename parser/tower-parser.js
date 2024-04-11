LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

module.exports = class TowerParser {
    type() {
        return 'tower';
    }

    constructor(...permitted_towers) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Towers.allTowers(),
            permitted_towers.map(d => d.toLowerCase()),
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
};