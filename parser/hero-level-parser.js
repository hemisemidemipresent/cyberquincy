const DeveloperCommandError = require('../exceptions/developer-command-error.js');
const NaturalNumberParser = require('./natural-number-parser.js');

// Read UserCommandError text below to see how version numbers should be specified
class HeroLevelParser {
    type() {
        return 'hero_level';
    }

    constructor(minLvl, maxLvl) {
        if (maxLvl > 20) {
            throw new DeveloperCommandError(`Hero level doesn't go past 20`);
        }
        
        if (!minLvl) minLvl = 1;
        if (!maxLvl) maxLvl = 20;

        // Ultimately at play is just a natural number parser with bounds
        this.delegateParser = new NaturalNumberParser(minLvl, maxLvl);
    }

    parse(arg) {
        arg = this.transformArgument(arg);
        return this.delegateParser.parse(arg);
    }

    // Parses all ways the command user could enter a hero level
    transformArgument(arg) {
        let result = arg.match(/^(?:l|lv|lvl)?-?(\d\d?)$/i);
        if (result) return result[1];
        else
            throw new UserCommandError(
                `Hero Level must look like \`L(V/VL)(-)#(#)\` (L2 / LVL10 / lv-20 / etc)`
            );
    }
}

module.exports = HeroLevelParser;
