import Aliases from '../aliases';
import * as Towers from './towers';

import type { MapCanonical, MapDifficultyCanonical } from '../types/aliases';
import type { TowerEntityMatch } from './towers';

function allMaps(): MapCanonical[] {
    return beginnerMaps()
        .concat(intermediateMaps())
        .concat(advancedMaps())
        .concat(expertMaps());
}

function allMapsFromMapDifficulty(mapDifficulty: MapDifficultyCanonical): MapCanonical[] {
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

// Accepts a map in either alias or index normal form, e.g. `dark_castle` or `Dark Castle`
function mapToMapDifficulty(m: string): MapDifficultyCanonical {
    const group = Aliases.lookupGroup(Aliases.toAliasNormalForm(m), 'map');
    if (!group) throw 'not a map';
    return group.mapDifficulty;
}

function mapsOfDifficulty(mapDifficulty: MapDifficultyCanonical): MapCanonical[] {
    return Aliases.groupsOfKind('map')
        .filter((ag) => ag.mapDifficulty === mapDifficulty)
        .map((ag) => ag.canonical);
}

function beginnerMaps(): MapCanonical[] {
    return mapsOfDifficulty('beginner');
}

function intermediateMaps(): MapCanonical[] {
    return mapsOfDifficulty('intermediate');
}

function advancedMaps(): MapCanonical[] {
    return mapsOfDifficulty('advanced');
}

function expertMaps(): MapCanonical[] {
    return mapsOfDifficulty('expert');
}

function allMapDifficulties(): MapDifficultyCanonical[] {
    return Aliases.canonicalsOfKind('map_difficulty');
}

// The index abbreviation of a map is its first alias, e.g. dark_dungeons -> DD
function mapToIndexAbbreviation(map: MapCanonical): string {
    const group = Aliases.lookupGroup(map, 'map');
    if (!group) throw new Error(`${map} is not a map canonical`);
    return group.aliases[0].toUpperCase();
}

function indexMapAbbreviationToMap(mapAbbr: string): MapCanonical | null {
    return Aliases.lookup(mapAbbr, 'map');
}

function indexMapAbbreviationToNormalForm(mapAbbr: string): string | null {
    const map = indexMapAbbreviationToMap(mapAbbr);
    return map ? Aliases.toIndexNormalForm(map) : null;
}

// e.g. `Dark Castle` -> DC; null for maps without aliases, such as a new map the index already knows about
function indexNormalFormToMapAbbreviation(map: string): string | null {
    const canonical = Aliases.lookup(Aliases.toAliasNormalForm(map), 'map');
    return canonical ? mapToIndexAbbreviation(canonical) : null;
}

// Index abbreviations of the maps that `entity` (e.g. `heli_pilot`, `druid#050` or `adora`) can't be placed on
function mapsNotPossible(entity: TowerEntityMatch['canonical']): string[] {
    let impossibleMaps: string[] = [];
    if (Towers.isWaterEntity(entity)) {
        // water towers are now technically possible?
        /* impossibleMaps = impossibleMaps.concat(
            // allNonWaterMaps().map((m) => mapToIndexAbbreviation(m))
        );*/
    } else if (Towers.isOfTower(entity, 'heli_pilot')) {
        impossibleMaps.push('MN');
    }

    return impossibleMaps;
}

export {
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
