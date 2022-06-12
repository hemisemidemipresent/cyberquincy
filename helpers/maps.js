const mapInfo = require('../jsons/map_info.json')

function allMaps() {
    return beginnerMaps()
        .concat(intermediateMaps())
        .concat(advancedMaps())
        .concat(expertMaps());
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

function allWaterMaps() {
    return allMaps().filter(
        (m) => !allNonWaterMaps().includes(m)
    );
}

function allNonWaterMaps(returnObjs=false) {
    const result = []
    allMaps().forEach(m => {
        mObj = new Map(m)
        if (mObj.waterPercentage() == '0%') {
            result.push(
                returnObjs ? mObj : mObj.name
            )
        }
    })
    return result
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
        if (!allMaps.includes(name)) {
            throw `${name} isn't a valid map according to QuincyBot. If this map is brand new, it will be added soon.`
        }

        this.name = name
    }

    aliases() {
        Aliases.getAliasSet(this.name)
    }

    toIndexAbbreviation() {
        return this.aliases()[1].toUpperCase()
    }

    format() {
        Aliases.toIndexNormalForm(this.name)
    }

    info() {
        mapInfo[this.name]
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
}

class MapDifficulty {
    
}

module.exports = {
    Map,
    MapDifficulty,

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
