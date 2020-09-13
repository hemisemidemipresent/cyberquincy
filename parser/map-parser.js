LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

module.exports = class MapParser {
    type() {
        return 'map';
    }

    errorMessage(badValue) {
        let msg = ''
        msg += `${badValue} is neither a map nor a map alias. Valid examples include \`logs\`, \`CUBE\`, \`bLoOdLeS\`, etc. `;
        msg += 'Use `q!alias <proper_map_name>` to learn map-name shorthands.'
        return msg;
    }

    constructor(...permitted_maps) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Aliases.allMaps(),
            permitted_maps.map((d) => d.toLowerCase()),
            this.errorMessage
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
};
