const NumberParser = require('./number-parser.js');

// Read UserCommandError text below to see how version numbers should be specified
class VersionParser {
    type() {
        return 'version';
    }

    constructor(minV, maxV) {
        // Ultimately at play is just a natural number parser with bounds
        this.delegateParser = new NumberParser(minV, maxV);
    }

    parse(arg) {
        arg = this.transformArgument(arg);
        let result = String(
            this.delegateParser.parse(arg)
        );

        if(/\../.test(arg) && !result.includes('.')) {
            result += '.0'
        }
        return result;
    }

    // Parses all ways the command user could enter a round
    transformArgument(arg) {
        var result = arg.match(/v(\d\d?\.?\d?)/i);
        if (result) return result[1];
        else
            throw new UserCommandError(
                `Version number must look like \`v#{#.#}\`. (V10{.} refers to v10.0, v10.1, and v10.2 e.g.)`
            );
    }
}

module.exports = VersionParser;
