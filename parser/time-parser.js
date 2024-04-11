const NumberParser = require('./number-parser.js');

// Looks for a time
// `mm:ss`, `hh:mm:ss`, `mm:ss.xxx`, `hh:mm:ss.xxx`
class TimeParser {
    type() {
        return 'time';
    }

    constructor() {
        // Ultimately at play is just a number parser
        this.delegateParser = new NumberParser(0, Infinity);
    }

    parse(arg) {
        // Convert `mm:ss`, `hh:mm:ss`, `mm:ss.xxx`, `hh:mm:ss.xxx` to a number representing seconds
        arg = this.transformArgument(arg);
        return this.delegateParser.parse(arg);
    }

    // Parses all ways the command user could enter a round
    transformArgument(arg) {
        if (!isNaN(arg)) return parseFloat(arg);
        let a = arg.split(':'); // split it at the colons
        let h = 0;
        let m = 0;
        let s = 0;
        if (a.length == 2) {
            m = a[0];
            s = a[1];
        } else {
            h = a[0];
            m = a[1];
            s = a[2];
        }
        // minutes are worth 60 seconds. Hours are worth 60 minutes, or 3600 seconds.
        let seconds = h * 3600 + m * 60 + parseFloat(s) * 1;
        if (isNaN(seconds))
            throw new UserCommandError(
                `Time must be of form \`mm:ss\`, \`hh:mm:ss\`, \`mm:ss.xxx\`, \`hh:mm:ss.xxx\` (Got \`${arg}\` instead)`
            );
        else return parseFloat(seconds);
    }
}

module.exports = TimeParser;
