module.exports = class ParsingError extends Error {
    constructor() {
        super();
        this.parsingErrors = [];
    }

    addError(e) {
        if (h.is_str(e)) {
            e = new Error(e);
        }

        if (!(e instanceof Error)) {
            throw `\`e\` must be error or string in \`ParsingError.addError(e)\`. Got ${typeof e}`;
        }

        this.parsingErrors.push(e);
    }

    hasErrors() {
        return this.parsingErrors.length > 0;
    }
}