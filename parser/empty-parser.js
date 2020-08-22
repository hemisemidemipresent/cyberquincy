const DeveloperCommandError = require("../exceptions/developer-command-error");

// parses nothing
module.exports = class EmptyParser {
    type() {
        return 'empty';
    }

    parse(_) {
        throw new DeveloperCommandError(`EmptyParser is a placeholder not meant to be parsed`);
    }
}