const DifficultyParser = require('./difficulty-parser.js');
const NaturalNumberParser = require('./natural-number-parser.js');

/**
 * Rounds permitted by command dev can only be specified by a difficulty
 * They are provided in commands like "15", "R15", or "ROUND15"
 */
module.exports = class RoundParser {
    type() {
        return "round";
    }

    constructor(difficulty) {
        // Defaults if difficulty isn't provided
        var startRound = 1;
        var endRound = Infinity;
        if (difficulty) {
            // Translate difficulty into round numbers
            this.translationParser = new DifficultyParser();
            try {
                this.translationParser.parse(difficulty);
            } catch(e) {
                if (e instanceof UserCommandError) {
                    throw new DeveloperCommandError(e.message);
                } else {
                    throw e;
                }
            }

            // At this point, the difficulty has been proven non-existent or valid

            // Translate difficulty into rounds
            [startRound, endRound] = h[difficulty + "_ROUNDS"];
        }
        
        this.delegateParser = new NaturalNumberParser(startRound, endRound)
    }

    parse(arg) {
        arg = this.transformArgument(arg);
        return this.delegateParser.parse(arg);
    }

    transformArgument(arg) {
        if (isNaN(arg)) {
            var result = arg.match(/(?:round|r)(\d+)/);
            if (result) return result[1];
            else throw new UserCommandError(`Round must be of form \`15\`, \`R15\` or \`round15\``);
        } else {
            return arg;
        }
    }
}