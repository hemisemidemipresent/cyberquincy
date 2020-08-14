// A wrapper error that contains a list of errors encountered during parsing.
// Used to provide the discord command user with the most accurate and helpful
// error message(s) possible.
module.exports = class ParsingError extends Error {
    constructor() {
        super();
        this.parsingErrors = [];
    }

    // `e` can be an instance of an Error or a string
    addError(e) {
        // If `e` is a String, then wrap it into an error
        if (h.is_str(e)) {
            e = new Error(e);
        }

        // At this point, `e` has to be of type Error
        if (!(e instanceof Error)) {
            throw `\`e\` must be error or string in \`ParsingError.addError(e)\`. Got ${typeof e}`;
        }

        // Add the error to the running list
        this.parsingErrors.push(e);
    }

    hasErrors() {
        return this.parsingErrors.length > 0;
    }
}