pluralize = require('pluralize');

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
}