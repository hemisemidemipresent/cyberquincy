StringSetValuesParser = require('./string-set-values-parser.js');

module.exports = class MapParser {
    type() {
        return 'map';
    }

    constructor(...permitted_maps) {
        // permitted maps must be a subset of valid maps
        // i.e. if command developer tried to put "cheese" it would error for obvious reasons
        for (var i = 0; i < permitted_maps.length; i++) {
            if (!Aliases.allMaps().includes(permitted_maps[i])) {
                throw new DeveloperCommandError(`${permitted_maps[i]} is not a valid map`);
            }
        }

        // If no permitted maps are provided, the permitted maps defaults to ALL maps
        if (permitted_maps.length === 0) {
            permitted_maps = Aliases.allMaps();
        }

        // DifficultyParser is just a specific instance of StringSetValuesParser with some additional validation
        // Decided to run with composition over inheritance because inheritance constructor rules are disgusting.
        this.delegateParser = new StringSetValuesParser(...permitted_maps.map(d => d.toLowerCase()));
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}