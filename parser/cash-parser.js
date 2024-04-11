const NumberParser = require('./number-parser.js');

// Looks for a round number, permitting natural numbers based on the difficulty provided to the constructor.
// Discord command users can provide the round in any of the following forms:
//    - 15, r15, round15
// Check the DifficultyParser for all possible difficulties that can be provided
class CashParser {
    type() {
        return 'cash';
    }

    constructor(low = 0, high = Infinity) {
        this.delegateParser = new NumberParser(low, high);
    }

    parse(arg) {
        // Convert `$5` to just `5`
        arg = this.transformArgument(arg);
        return this.delegateParser.parse(arg);
    }

    // Parses all ways the command user could enter a round
    transformArgument(arg) {
        if (arg[0] == '$') {
            return arg.slice(1);
        } else if (arg.includes('-')) {
            // 40000 - 30012
            let stuff = arg.split('-');
            if (/\d|\./.test(stuff[0]) && /\d|\./.test(stuff[0])) {
                return (stuff[0] - stuff[1]).toString();
            } else {
                if (arg.length > 100) arg = arg.substring(0, 100) + '...';
                throw new UserCommandError(
                    `Cash must be of form \`15\` or \`$15\` (Got \`${arg}\` instead)`
                );
            }
        } else if (/\d|\./.test(arg[0])) {
            return arg;
        } else {
            if (arg.length > 100) arg = arg.substring(0, 100) + '...';

            throw new UserCommandError(
                `Cash must be of form \`15\` or \`$15\` (Got \`${arg}\` instead)`
            );
        }
    }
}

module.exports = CashParser;
