const DifficultyParser = require('./difficulty-parser.js');
const NaturalNumberParser = require('./natural-number-parser.js');

const roundHelper = require('../helpers/rounds');
// Looks for a round number, permitting natural numbers based on the difficulty provided to the constructor.
// Discord command users can provide the round in any of the following forms:
//    - 15, r15, round15
// Check the DifficultyParser for all possible difficulties that can be provided
class RoundParser {
    type() {
        return 'round';
    }

    constructor(difficulty, abr=false) {
        // Defaults to any possible valid BTD6 round (1-->who knows) if difficulty isn't provided
        let startRound = 1;
        let endRound = Infinity;
        if (difficulty) {
            if (!['ALL', 'PREDET', 'PREDET_CHIMPS'].includes(difficulty)) {
                // "ALL" represents "ALL_ROUNDS"
                // Translate difficulty into round numbers
                this.translationParser = new DifficultyParser();
                try {
                    // Ensure that the difficulty is valid
                    this.translationParser.parse(difficulty);
                } catch (e) {
                    // The "user" here is really the developer, which is why the error type is converted
                    if (e instanceof UserCommandError) {
                        throw new DeveloperCommandError(e.message);
                    } else {
                        throw e;
                    }
                }
            }

            // At this point, the difficulty has been proven valid or has been defaulted

            // Translate difficulty into rounds
            // The general helper module has the conversion between difficulty and valid rounds
            [startRound, endRound] = roundHelper[difficulty + '_ROUNDS'];
        }

        // Ultimately at play is just a natural number parser with bounds
        this.delegateParser = new NaturalNumberParser(startRound, endRound);

        this.abr = abr
    }

    parse(arg) {
        // Convert `R5` or `round5` to just `5`
        arg = this.transformArgument(arg);
        return this.delegateParser.parse(arg);
    }

    // Parses all ways the command user could enter a round
    transformArgument(arg) {
        if (isNaN(arg)) {
            const prefix = this.abr ? '(?:abr|a)' : '(?:round|r)';
            const result = arg.match(new RegExp(`^${prefix}(\\d+)$`));

            const r1 = this.abr ? 'A' : 'R';
            const r2 = this.abr ? 'abr' : 'round';
            if (result) return result[1];
            else throw new UserCommandError(`Round must be of form \`${r1}15\` or \`${r2}15\` (Got \`${arg}\` instead)`);
        } else {
            return arg;
        }
    }
}

module.exports = RoundParser;
