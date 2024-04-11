LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');
const Maps = require('../helpers/maps');

class MapParser {
    type() {
        return 'map';
    }

    constructor(...permitted_maps) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Maps.allMaps(),
            permitted_maps.map(d => d.toLowerCase()),
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}

module.exports = MapParser;
