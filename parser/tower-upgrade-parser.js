StringSetValuesParser = require('./string-set-values-parser.js');

module.exports = class TowerUpgradeParser {
    type() {
        return 'tower_upgrade';
    }

    constructor() {
        // TowerUpgradeParser is just a specific instance of StringSetValuesParser with some additional validation
        // Decided to run with composition over inheritance because inheritance constructor rules are disgusting.
        this.delegateParser = new StringSetValuesParser(
            ...Aliases.allTowerUpgrades().map(tu => tu.toLowerCase())
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
};
