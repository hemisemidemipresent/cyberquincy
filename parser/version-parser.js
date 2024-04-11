const UserCommandError = require('../exceptions/user-command-error.js');
const NumberParser = require('./number-parser.js');

// Read UserCommandError text below to see how version numbers should be specified
class VersionParser {
    type() {
        return 'version';
    }

    constructor(minV, maxV, allowSubVersion=true) {
        // Ultimately at play is just a natural number parser with bounds
        this.delegateParser = new NumberParser(minV || 1, maxV);
        this.allowSubVersion = allowSubVersion;
    }

    parse(arg) {
        arg = this.transformArgument(arg);
        let result = String(
            this.delegateParser.parse(arg)
        );

        if(/\../.test(arg) && !result.includes('.')) {
            result += '.0';
        }
        return result;
    }

    // Parses all ways the command user could enter a round
    transformArgument(arg) {
        let result = null;
        if (this.allowSubVersion) {
            result = arg.match(/^v(\d\d?\.?\d?)$/i);
            if (result) return result[1];
            else this.badFormattingError(arg);
        } else {
            result = arg.match(/^v(\d\d?)$/i);
            if (result) return result[1];
            else {
                result = arg.match(/^v(\d\d?\.?\d?)$/i);
                if (result) {
                    throw new UserCommandError(
                        `This command doesn't allow subversions, just natural numbers like \`v10\` and \`v6\`. Received \`${arg}\` instead.`
                    );
                } else this.badFormattingError(arg);
            }
        }
    }

    badFormattingError(arg) {
        throw new UserCommandError(
            `Version number must look like \`v#{#.#}\`. (V10{.} refers to v10.0, v10.1, and v10.2 e.g.) Got \`${arg}\` instead.`
        );
    }
}

module.exports = VersionParser;
