LimitedStringSetValuesParser = require('./limited-string-set-values-parser.js');

module.exports = class TowerUpgradeParser {
    type() {
        return 'tower_upgrade';
    }

    constructor(...permitted_tower_upgrades) {
        this.delegateParser = new LimitedStringSetValuesParser(
            this.type(),
            Aliases.allTowerUpgrades(),
            permitted_tower_upgrades.map(d => d.toLowerCase()),
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
};