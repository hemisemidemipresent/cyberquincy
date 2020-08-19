const StringSetValuesParser = require('./string-set-values-parser.js');
const AliasRepository = require('../alias-repository.js');
module.exports = class ModeParser {
    type() {
        return "mode";
    }

    // permitted modes must be a subset of valid modes
    // i.e. if command developer tried to put "cheese" it would error for obvious reasons
    constructor(...permitted_modes) {
        for (var i = 0; i < permitted_modes.length; i++) {
            if (!Aliases.allModes().includes(permitted_modes[i].toLowerCase())) {
                throw new DeveloperCommandError(`${permitted_modes[i]} is not a valid gamemode`);
            }
        }

        // If no permitted modes are provided, the permitted modes defaults to ALL modes
        if (permitted_modes.length === 0) {
            permitted_modes = Aliases.allModes();
        }

        // ModeParser is just a specific instance of StringSetValuesParser with some additional validation
        // Decided to run with composition over inheritance because inheritance constructor rules are disgusting.
        this.delegateParser = new StringSetValuesParser(...permitted_modes.map(m => m.toLowerCase()));
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}