LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');
// we want to only maintain an alias of unmodified bloon names but we also want to be able to parse things like fmoab, cceramic, rrainbow, etc...
// the order is crf
class BloonParser {
    type() {
        return 'bloon';
    }

    constructor(...permitted_bloons) {
        let permitted_values = permitted_bloons.map((d) => d.toLowerCase());
        addModifiers(Aliases.allBloons());

        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Aliases.allBloons(),
            permitted_values
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }

    addModifiers(bloons) {
        console.log(bloons);
    }
}

module.exports = BloonParser;
