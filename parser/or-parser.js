const DeveloperCommandError = require("../exceptions/developer-command-error");

// to allow various ways to use parse arguments and ultimately use a command
class OrParser {
    // Takes in a list of parser lists
    constructor(...parserLists) {
        this.parserLists = parserLists;

        if (!(this.parserLists instanceof Array)) {
            throw new DeveloperCommandError(
                `OrParser expects a list of parser lists but got ${typeof this.parserLists} instead`
            );
        }

        if (this.parserLists.length < 2) {
            throw new DeveloperCommandError(
                `OrParser must take at least 2 arguments but got just ${this.parserLists.length} instead`
            );
        }
    }

    type() {
        return 'or';
    }

    parse() {
        throw `Must not parse directly from the OrParser. Must parse argument list parsers instead`;
    }
}

module.exports = OrParser;
