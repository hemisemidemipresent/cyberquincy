StringSetValuesParser = require('./string-set-values-parser.js');

module.exports = class ModeParser {
    VALID_MODES = [
        "STANDARD",
        "PRIMARYONLY",
        "DEFLATION",
        "MILITARYONLY",
        "APOPALYPSE",
        "REVERSE",
        "MAGICONLY",
        "DOUBLEHP",
        "HALFCASH",
        "ABR",
        "IMPOPPABLE",
        "CHIMPS",
    ]

    type() {
        return "mode";
    }

    constructor(...permitted_modes) {
        for (var i = 0; i < permitted_modes.length; i++) {
            if (!this.VALID_MODES.includes(permitted_modes[i])) {
                throw new DeveloperCommandError(`${permitted_modes[i]} is not a valid gamemode`);
            }
        }
        // Use a string set permitted_modes parser contain valid modes
        this.delegateParser = new StringSetValuesParser(...permitted_modes.map(m => m.toLowerCase()));
    }

    parse(arg) {
        // The error handling in the delegate parser is descriptive enough
        return this.delegateParser.parse(arg);
    }
}