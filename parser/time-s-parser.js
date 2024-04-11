const NumberParser = require('./number-parser.js');

// Looks for a number, permitting any number
// Discord command users can provide the time in seconds any of the following forms:
//    - 15, 15s, 15sec
class SecondsParser {
    type() {
        return 'time-s';
    }

    constructor() {
        // Ultimately at play is just a number parser
        this.delegateParser = new NumberParser(0, Infinity);
    }

    parse(arg) {
        // Convert `R5` or `round5` to just `5`
        arg = this.transformArgument(arg);
        return this.delegateParser.parse(arg);
    }

    // Parses all ways the command user could enter a round
    transformArgument(arg) {
        if (isNaN(arg)) {
            let result = arg.match(/[+-]?([0-9]*[.])?[0-9]+(?=sec|s)/);
            // see: https://stackoverflow.com/questions/12643009/regular-expression-for-floating-point-numbers/42629198#42629198

            if (result) return result[0];
            else
                throw new UserCommandError(
                    `Round must be of form \`15\`, \`15s\` or \`15sec\` (Got \`${arg}\` instead)`
                );
        } else {
            return arg;
        }
    }
}

module.exports = SecondsParser;
