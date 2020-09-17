const AnythingParser = require("./anything-parser");

// Parses a user listed in the BTD6 Index
module.exports = class PersonParser {
    type() {
        return "person";
    }

    constructor() {
        this.delegateParser = new AnythingParser();
    }
    
    parse(arg) {
        return this.delegateParser.parse(arg);
    }
}