pluralize = require('pluralize');
const gHelper = require('../helpers/general.js');

// Simply an extension of an object with the added property
// where if a property is supplied, a plural form of the key is consequently updated.
// This allows for the case if the command-parser parses multiple rounds
// then parsed.rounds will give a list of all the parsed rounds,
// at which point the command developer can then decide how to read and handle them.
// Note that there's no guarantee on ordering for the values of the pluralized keys
class Parsed extends Object {
    constructor() {
        super();
        this.parsingErrors = [];
    }

    addField(type, value) {
        if (!value) return;

        let types = pluralize(type);
        if (types == type) types += 's';

        // If this is the second+ of the type (<round>/<difficulty>/etc.) being parsed
        if (this[type]) {
            // Add it to the list for the given type
            this[types].push(value);
        }
        // If this is the first of the type being parsed
        else {
            // Add it to the currently empty list for the given type
            this[types] = [value];
            // This is for convenience. If only one round is being parsed
            // then you can use parsed.round rather than parsed.round[0]
            // If there are multiple, this will still return the first in the list
            this[type] = value;
        }
    }

    // Combines two Parsed objects and returns the result
    merge(otherParsed) {
        const parsed = new Parsed();
        for (const type in this) {
            this.__mergeField(type, parsed, this);
        }

        for (const type in otherParsed) {
            this.__mergeField(type, parsed, otherParsed);
        }

        parsed.parsingErrors = this.parsingErrors.concat(
            otherParsed.parsingErrors
        );

        return parsed;
    }

    __mergeField(type, newParsed, oldParsed) {
        if (oldParsed[type] instanceof Array) {
            if (newParsed[type]) {
                newParsed[type].push(...oldParsed[type]);
            } else {
                newParsed[type] = [...oldParsed[type]];
            }
        } else {
            newParsed[type] = oldParsed[type];
        }
    }

    addError(e) {
        // If `e` is a String, then wrap it into an error
        if (gHelper.is_str(e)) {
            e = new Error(e);
        }

        // At this point, `e` has to be of type Error
        if (!(e instanceof Error)) {
            throw `\`e\` must be error or string in \`Parsed.addError(e)\`. Got ${typeof e}`;
        }

        // Add the error to the running list
        this.parsingErrors.push(e);
    }

    hasErrors() {
        return this.parsingErrors.length > 0;
    }

    hasAny() {
        // Parsing errors come included
        return Object.keys(this).length > 1;
    }
}

module.exports = Parsed;
