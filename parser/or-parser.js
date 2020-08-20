// A wrapper around any number of lists of parsers

const DeveloperCommandError = require("../exceptions/developer-command-error");

// to allow various ways to use parse arguments and ultimately use a command
module.exports = class OrParser {
    // Takes in the concrete parser and a default value is the parser fails to parse
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

        for (var i = 0; i < parserLists.length; i++) {
            parsers = parserLists[i];
            if (!(parsers instanceof Array)) {
                throw new DeveloperCommandError(
                    `OrParser arguments must be Arrays of Parsers but ` +
                     `${toOrdinalSuffix(i)} argument was type ${typeof parsers}.`
                );
            }
        }
    }

    type() {
        return 'or';
    }

    parse(_) {
        throw `Must not parse directly from the OrParser. Must parse argument list parsers instead`
    }
}