StringSetValuesParser = require('./string-set-values-parser.js');

module.exports = class DifficultyParser {
    VALID_DIFFICULTIES = ['IMPOPPABLE', 'HARD', 'MEDIUM', 'EASY'];

    type() {
        return 'difficulty';
    }

    constructor(...permitted_difficulties) {
        // permitted difficulties must be a subset of valid difficulties
        // i.e. if command developer tried to put "cheese" it would error for obvious reasons
        for (let i = 0; i < permitted_difficulties.length; i++) {
            if (!this.VALID_DIFFICULTIES.includes(permitted_difficulties[i])) {
                throw new DeveloperCommandError(
                    `${permitted_difficulties[i]} is not a valid difficulty`
                );
            }
        }

        // If no permitted difficulties are provided, the permitted difficulties defaults to ALL difficulties
        if (permitted_difficulties.length === 0) {
            permitted_difficulties = this.VALID_DIFFICULTIES;
        }

        // DifficultyParser is just a specific instance of StringSetValuesParser with some additional validation
        // Decided to run with composition over inheritance because inheritance constructor rules are disgusting.
        this.delegateParser = new StringSetValuesParser(
            ...permitted_difficulties.map((d) => d.toLowerCase())
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
};
