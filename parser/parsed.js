pluralize = require('pluralize');

// Simply an extension of an object with the added property
// where if a property is supplied, a plural form of the key is kept.
// This allows for the case if there are multiple rounds to be parsed
// then parsed.rounds will give a list of the rounds.
// The command developer can then decide how to handle them.
// Note that there's no guarantee on ordering for the values
// corresponding to the pluralized keys
module.exports = class Parsed extends Object {
    addField(type, value) {
        var types = pluralize(type)

        // If this is the second+ of the type (<round>/<difficulty>/etc.) being parsed
        if (this[type]) {
            // Add it to the list for the given type
            this[types] += value;
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
        parsed = new Parsed();
        for (const type in this) {
            parsed.addField(type, this[type]);
        }

        for (const type in otherParsed) {
            parsed.addField(type, otherParsed[type]);
        }

        return parsed;
    }
}