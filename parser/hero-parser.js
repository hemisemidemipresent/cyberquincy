StringSetValuesParser = require('./string-set-values-parser.js');

module.exports = class HeroParser {
    type() {
        return 'hero';
    }

    constructor(...permitted_heroes) {
        // permitted heroes must be a subset of valid heroes
        // i.e. if command developer tried to put "cheese" it would error for obvious reasons
        for (let i = 0; i < permitted_heroes.length; i++) {
            if (!Aliases.allheroes().includes(permitted_heroes[i])) {
                throw new DeveloperCommandError(
                    `${permitted_heroes[i]} is not a valid hero`
                );
            }
        }

        // If no permitted heroes are provided, the permitted heroes defaults to ALL heroes
        if (permitted_heroes.length === 0) {
            permitted_heroes = Aliases.allHeroes();
        }

        this.delegateParser = new StringSetValuesParser(
            ...permitted_heroes.map((d) => d.toLowerCase())
        );
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
};
