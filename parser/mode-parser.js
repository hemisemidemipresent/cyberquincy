LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');
const Aliases = require('../aliases');

class ModeParser {
    type() {
        return 'mode';
    }

    constructor(...permitted_modes) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Aliases.canonicalsOfKind('game_mode'),
            permitted_modes.map(d => d.toLowerCase()),
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}

module.exports = ModeParser;
