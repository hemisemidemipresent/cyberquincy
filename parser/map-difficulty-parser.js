StringSetValuesParser = require('./string-set-values-parser.js');

module.exports = class DifficultyParser {
    VALID_DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

    type() {
        return 'map_difficulty';
    }

    constructor(...permitted_map_difficulties) {
        // permitted map difficulties must be a subset of valid map difficulties
        // i.e. if command developer tried to put "cheese" it would error for obvious reasons
        for (let i = 0; i < permitted_map_difficulties.length; i++) {
            if (!this.VALID_DIFFICULTIES.includes(permitted_map_difficulties[i])) {
                throw new DeveloperCommandError(
                    `${permitted_map_difficulties[i]} is not a valid map difficulty`
                );
            }
        }

        // If no permitted map difficulties are provided, 
        // the permitted map difficulties defaults to ALL map difficulties
        if (permitted_map_difficulties.length === 0) {
            permitted_map_difficulties = this.VALID_DIFFICULTIES;
        }

        this.delegateParser = new StringSetValuesParser(
            ...permitted_map_difficulties.map((d) => d.toLowerCase())
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
};
