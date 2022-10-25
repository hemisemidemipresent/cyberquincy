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
    switch (mapDifficulty) {
        case 'beginner':
            return this.beginnerMaps();
        case 'intermediate':
            return this.intermediateMaps();
        case 'advanced':
            return this.advancedMaps();
        case 'expert':
            return this.expertMaps();
        default:
            throw `${mapDifficulty} is not a map difficulty`;
    }
}

function beginnerMaps() {
    return this.getAliasGroupsFromSameFileAs('LOGS').map(
        (ag) => ag.canonical
    );
}

function intermediateMaps() {
    return this.getAliasGroupsFromSameFileAs('HAUNTED').map(
        (ag) => ag.canonical
    );
}

function advancedMaps() {
    return this.getAliasGroupsFromSameFileAs('CORNFIELD').map(
        (ag) => ag.canonical
    );
}

function expertMaps() {
    return this.getAliasGroupsFromSameFileAs('INFERNAL').map(
        (ag) => ag.canonical
    );
}

function allMapDifficulties() {
    const map_difficulties =
        this.getAliasGroupsFromSameFileAs('INTERMEDIATE');

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
    mapToIndexAbbreviation(
        Aliases.toAliasNormalForm(map)
    );
}


module.exports = {
    allMaps,
    allWaterMaps,
    allNonWaterMaps,
    allMapsFromMapDifficulty,
    beginnerMaps,
    intermediateMaps,
    advancedMaps,
    expertMaps,
    allMapDifficulties,
    mapToIndexAbbreviation,
    indexMapAbbreviationToMap,
    indexMapAbbreviationToNormalForm,
    indexNormalFormToMapAbbreviation,
}