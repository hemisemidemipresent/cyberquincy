StringSetValuesParser = require('./string-set-values-parser.js');

module.exports = class MapParser {
    VALID_MAPS = [
        "LOGS",
        "CUBISM",
        "CANDY_FALLS",
        "CARVED",
        "IN_THE_LOOP",
        "TREE_STUMP",
        "HEDGE",
        "FOUR_CIRCLES",
        "WINTER_PARK",
        "FROZEN_OVER",
        "PARK_PATH",
        "LOTUS_ISLAND",
        "ALPINE_RUN",
        "TOWN_CENTER",
        "MONKEY_MEADOW",
        "END_OF_THE_ROAD",
        "MOON_LANDING",
        "CRACKED",
        "KARTSNDARTS",
        "FIRING_RANGE",
        "ADORA'S_TEMPLE",
        "DOWNSTREAM",
        "STREAMBED",
        "SPRING_SPRING",
        "SPICE_ISLANDS",
        "BAZAAR",
        "HAUNTED",
        "CHUTES",
        "RAKE",
        "CORNFIELD",
        "SPILLWAY",
        "HIGH_FINANCE",
        "ANOTHER_BRICK",
        "OFF_THE_COAST",
        "PENINSULA",
        "PAT'S_POND",
        "GEARED",
        "UNDERGROUND",
        "CARGO",
        "INFERNAL",
        "WORKSHOP",
        "QUAD",
        "MUDDY_PUDDLES",
        "#OUCH",
        "BLOODY_PUDDLES",
        "FLOODED_VALLEY",
        "DARK_CASTLE",
    ]

    type() {
        return 'map';
    }

    constructor(...permitted_maps) {
        // permitted maps must be a subset of valid maps
        // i.e. if command developer tried to put "cheese" it would error for obvious reasons
        for (var i = 0; i < permitted_maps.length; i++) {
            if (!this.VALID_MAPS.includes(permitted_maps[i])) {
                throw new DeveloperCommandError(`${permitted_maps[i]} is not a valid map`);
            }
        }

        // If no permitted maps are provided, the permitted maps defaults to ALL maps
        if (permitted_maps.length === 0) {
            permitted_maps = this.VALID_MAPS;
        }

        // DifficultyParser is just a specific instance of StringSetValuesParser with some additional validation
        // Decided to run with composition over inheritance because inheritance constructor rules are disgusting.
        this.delegateParser = new StringSetValuesParser(...permitted_maps.map(d => d.toLowerCase()));
    }

    parse(arg) {
        // Delegate the parsing work to the StringSetValuesParser
        return this.delegateParser.parse(arg);
    }
}