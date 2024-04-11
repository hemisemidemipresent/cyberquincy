const EnemyHelper = require('../helpers/enemies');

LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');
// we want to only maintain an alias of unmodified bloon names but we also want to be able to parse things like fmoab, cceramic, rrainbow, etc...
// the order of prefixes are "crf"
class BloonParser {
    type() {
        return 'bloon';
    }

    constructor(...permitted_bloons) {
        let permitted_values = permitted_bloons.map((d) => d.toLowerCase());
        let bloons = this.addModifiers(EnemyHelper.allEnemies());
        if (permitted_values.length == 0) {
            permitted_values = bloons;
        }
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            bloons,
            permitted_values
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }

    addModifiers(bloons) {
        // there are a loooooooot of duplicates in the modified arrays.
        // TODO: remove duplicates innately
        let moddedBloons = [];
        for (let i = 0; i < 2; i++) {
            // camo
            for (let j = 0; j < 2; j++) {
                // regrow
                for (let k = 0; k < 2; k++) {
                    // fortified
                    for (let l = 0; l < bloons.length; l++) {
                        let bloon = bloons[l] + '';
                        let isCamo = !!i;
                        let isRegrow = !!j;
                        let isFortified = !!k;

                        let isFortifiable =
                            (bloon == 'moab' ||
                                bloon == 'bfb' ||
                                bloon == 'zomg' ||
                                bloon == 'bad' ||
                                bloon == 'ceramic' ||
                                bloon == 'lead' ||
                                bloon == 'ddt') &&
                            isFortified;
                        let isRegrowable =
                            !(
                                bloon == 'moab' ||
                                bloon == 'bfb' ||
                                bloon == 'zomg' ||
                                bloon == 'bad' ||
                                bloon == 'ddt'
                            ) && isRegrow;
                        if (isCamo || isRegrowable || isFortifiable) {
                            // add a dash before the prefixes
                            bloon = '-' + bloon;
                        }
                        if (isFortifiable) {
                            bloon = 'f' + bloon;
                        }
                        if (isRegrowable) {
                            bloon = 'r' + bloon;
                        }
                        if (isCamo) {
                            bloon = 'c' + bloon;
                        }

                        moddedBloons.push(bloon);
                    }
                }
            }
        }

        return moddedBloons;
    }
}

module.exports = BloonParser;
