StringSetValuesParser = require('./string-set-values-parser.js');

module.exports = class DifficultyParser {
    VALID_DIFFICULTIES = [
        "IMPOPPABLE",
        "HARD",
        "MEDIUM",
        "EASY",
    ]

    type() {
        return 'difficulty';
    }

    constructor(...permitted_difficulties) {
        for (var i = 0; i < permitted_difficulties.length; i++) {
            if (!this.VALID_DIFFICULTIES.includes(permitted_difficulties[i])) {
                throw new DeveloperCommandError(`${permitted_difficulties[i]} is not a valid difficulty`);
            }
        }
        if (permitted_difficulties.length === 0) {
            permitted_difficulties = this.VALID_DIFFICULTIES;
        }
        this.delegateParser = new StringSetValuesParser(...permitted_difficulties.map(d => d.toLowerCase()));
    }

    parse(arg) {
        // The error handling in the delegate parser is descriptive enough
        return this.delegateParser.parse(arg);
    }
}