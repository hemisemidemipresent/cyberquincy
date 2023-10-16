const UserCommandError = require("../exceptions/user-command-error");

// Parses a user listed in the BTD6 Index
class PersonParser {
    type() {
        return "person";
    }

    parse(arg) {
        const result = arg.match(/user#(.*)/);
        if (result) {
            return result[1];
        } else {
            throw new UserCommandError(`Username must start with \`user#\` or \`u#\` but got ${arg} instead`);
        }
    }
}

module.exports = PersonParser;
