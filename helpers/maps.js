const Aliases = require('../aliases');
const { SUPERGROUPS } = require('../alias-repository');
const Towers = require('./towers');

function allMaps() {
    return beginnerMaps()
        .concat(intermediateMaps())
        .concat(advancedMaps())
        .concat(expertMaps());
}

function allMapsFromMapDifficulty(mapDifficulty) {
    switch (mapDifficulty.toLowerCase()) {
        case 'beginner':
            return beginnerMaps();
        case 'intermediate':
            return intermediateMaps();
        case 'advanced':
            return advancedMaps();
        case 'expert':
            return expertMaps();
        default:
            throw `${mapDifficulty} is not a map difficulty`;
    }
}

function mapToMapDifficulty(m) {
    const group = Aliases.lookupGroup(Aliases.toAliasNormalForm(m), 'map');
    if (!group) throw 'not a map';
    return group.mapDifficulty;
}

function mapsOfDifficulty(mapDifficulty) {
    return Aliases.groupsOfKind('map')
        .filter((ag) => ag.mapDifficulty === mapDifficulty)
        .map((ag) => ag.canonical);
}

function beginnerMaps() {
    return mapsOfDifficulty('beginner');
}

function intermediateMaps() {
    return mapsOfDifficulty('intermediate');
}

function advancedMaps() {
    return mapsOfDifficulty('advanced');
}

function expertMaps() {
    return mapsOfDifficulty('expert');
}

function allMapDifficulties() {
    return Aliases.canonicalsOfKind('map_difficulty');
}

// The index abbreviation of a map is its first alias, e.g. dark_dungeons -> DD
function mapToIndexAbbreviation(map) {
    const group = Aliases.lookupGroup(map, 'map');
    if (!group) return null;
    return group.aliases[0].toUpperCase();
}

function indexMapAbbreviationToMap(mapAbbr) {
    return Aliases.lookup(mapAbbr, 'map');
}

function indexMapAbbreviationToNormalForm(mapAbbr) {
    return Aliases.toIndexNormalForm(
        indexMapAbbreviationToMap(mapAbbr)
    );
}

function indexNormalFormToMapAbbreviation(map) {
    return mapToIndexAbbreviation(
        Aliases.toAliasNormalForm(map)
    );
}

function mapsNotPossible(entity) {
    const canonicalEntity = Aliases.lookupMultiple(Aliases.toAliasNormalForm(entity), SUPERGROUPS.TOWER)?.canonical ?? null;

    let impossibleMaps = [];
    if (Towers.isWaterEntity(canonicalEntity)) {
        // water towers are now technically possible?
        /* impossibleMaps = impossibleMaps.concat(
            // allNonWaterMaps().map((m) => mapToIndexAbbreviation(m))
        );*/
    } else if (Towers.isOfTower(canonicalEntity, 'heli_pilot')) {
        impossibleMaps.push('MN');
    }

    return impossibleMaps;
}

module.exports = {
    allMaps,
    allMapsFromMapDifficulty,
    mapToMapDifficulty,
    beginnerMaps,
    intermediateMaps,
    advancedMaps,
    expertMaps,
    mapsNotPossible,
    allMapDifficulties,
    mapToIndexAbbreviation,
    indexMapAbbreviationToMap,
    indexMapAbbreviationToNormalForm,
    indexNormalFormToMapAbbreviation,
};