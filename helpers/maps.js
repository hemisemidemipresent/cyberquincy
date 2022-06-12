const mapInfo = require('../jsons/map_info.json')

function allMapNames() {
    return Aliases.getAliasGroupsFromSameImmediateDirectoryAs('LOGS').map(g => g.canonical)
}

function allMaps() {
    return beginnerMaps()
        .concat(intermediateMaps())
        .concat(advancedMaps())
        .concat(expertMaps());
}

function mapsFromSameFileAs(alias) {
    return Aliases.getAliasGroupsFromSameFileAs(alias).map(
        (ag) => ag.canonical
    ).map(m => new Map(m));
}

function beginnerMaps() {
    return mapsFromSameFileAs('LOGS')
}

function intermediateMaps() {
    return mapsFromSameFileAs('HAUNTED')
}

function advancedMaps() {
    return mapsFromSameFileAs('CORNFIELD')
}

function expertMaps() {
    return mapsFromSameFileAs('INFERNAL')
}

NO_WATER_SIGNIFIER = '0%'

function allWaterMaps() {
    return allMaps().filter(m => m.waterPercentage() != NO_WATER_SIGNIFIER)
}

function allNonWaterMaps() {
    return allMaps().filter(m => m.waterPercentage() == NO_WATER_SIGNIFIER)
}

function allMapDifficulties() {
    const map_difficulties =
        Aliases.getAliasGroupsFromSameFileAs('INTERMEDIATE');

    return map_difficulties.map((ag) => ag.canonical);
}

function allMapsFromMapDifficulty(mapDifficulty) {
    switch (mapDifficulty) {
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

class Map {
    constructor(name) {
        if (!allMapNames().includes(name)) {
            throw `${name} isn't a valid map according to QuincyBot. If this map is brand new, it will be added soon.`
        }

        this.name = name
    }

    aliases() {
        return Aliases.getAliasSet(this.name)
    }

    toIndexAbbreviation() {
        return this.aliases()[1].toUpperCase()
    }

    format() {
        return Aliases.toIndexNormalForm(this.name)
    }

    info() {
        return mapInfo[this.name]
    }

    length(format=false) {
        return format ? this.info().lenStr : this.info().len
    }

    numObstacles() {
        return this.info().obst
    }

    costToRemoveAllObstacles() {
        return this.info().costObst
    }

    waterPercentage() {
        return this.info().wa
    }

    versionAdded() {
        return this.info().ver
    }

    thumbnailUrl() {
        return this.info().thu
    }

    entrancesAndExits() {
        return this.info().e
    }

    static fromAlias(a) {
        if (!a) return null
        const g = Aliases.getAliasGroup(a.toLowerCase())
        if (!g) return null
        return new Map(g.canonical)
    }
}

module.exports = {
    Map,

    allMaps,
    beginnerMaps,
    intermediateMaps,
    advancedMaps,
    expertMaps,

    allWaterMaps,
    allNonWaterMaps,

    allMapDifficulties,
    allMapsFromMapDifficulty,
}
