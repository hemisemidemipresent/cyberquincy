function allMaps() {
    return beginnerMaps()
        .concat(intermediateMaps())
        .concat(advancedMaps())
        .concat(expertMaps());
}

function allWaterMaps() {
    return allMaps().filter(
        (m) => !allNonWaterMaps().includes(m)
    );
}

// TODO: rewrite this involving the q!map command results rather than hardcoding it
function allNonWaterMaps() {
    return [
        'SY',
        'TS',
        'H',
        'AR',
        'MM',
        'ML',
        'KD',
        'CF',
        'GD',
        'UG',
        'MS',
        'W',
        'XF',
        'MN',
    ].map((m) => Aliases.getCanonicalForm(m.toLowerCase()));
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
    const formattedMap = Aliases.toAliasCanonical(m);
    if (beginnerMaps().includes(formattedMap)) {
        return 'beginner';
    } else if (intermediateMaps().includes(formattedMap)) {
        return 'intermediate';
    } else if (advancedMaps().includes(formattedMap)) {
        return 'advanced';
    } else if (expertMaps().includes(formattedMap)) {
        return 'expert';
    } else {
        throw 'not a map';
    }
}

function beginnerMaps() {
    return Aliases.getAliasGroupsFromSameFileAs('LOGS').map(
        (ag) => ag.canonical
    );
}

function intermediateMaps() {
    return Aliases.getAliasGroupsFromSameFileAs('HAUNTED').map(
        (ag) => ag.canonical
    );
}

function advancedMaps() {
    return Aliases.getAliasGroupsFromSameFileAs('CORNFIELD').map(
        (ag) => ag.canonical
    );
}

function expertMaps() {
    return Aliases.getAliasGroupsFromSameFileAs('INFERNAL').map(
        (ag) => ag.canonical
    );
}

function allMapDifficulties() {
    const map_difficulties =
        Aliases.getAliasGroupsFromSameFileAs('INTERMEDIATE');

    return map_difficulties.map((ag) => ag.canonical);
}

function mapToIndexAbbreviation(map) {
    if (!map) return null;
    const mapAliases = Aliases.getAliasSet(map);
    if (!mapAliases) return null;
    return mapAliases[1].toUpperCase();
}

function indexMapAbbreviationToMap(mapAbbr) {
    const set = Aliases.getAliasSet(
        mapAbbr.toLowerCase()
    );
    if (!set) return null;
    return set[0];
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
    const canonicalEntity = Aliases.toAliasCanonical(entity);

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
    allWaterMaps,
    allNonWaterMaps,
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