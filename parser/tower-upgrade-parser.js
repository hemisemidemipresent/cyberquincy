LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

class TowerUpgradeParser {
    type() {
        return 'tower_upgrade';
    }

    constructor(...permittedTowerUpgrades) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Towers.allTowerUpgrades(),
            permittedTowerUpgrades.map(d => d.toLowerCase()),
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}

module.exports = TowerUpgradeParser;
