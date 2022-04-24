//////////////////////////////////////////////////////
// Cacheing 
//////////////////////////////////////////////////////

const fs = require('fs')
const resolve = require('path').resolve;
const gHelper = require('../helpers/general')

DIR1 = 'cache'
DIR2 = 'index'

function hasCachedCombos(fname) {
    return fs.existsSync(resolve(DIR1, DIR2, fname))
}

function fetchCachedCombos(fname) {
    const data = fs.readFileSync(resolve(DIR1, DIR2, fname))
    return JSON.parse(data).combos;
}

function cacheCombos(combos, fname) {
    const fileData = JSON.stringify({ combos: combos })

    const dir1 = resolve(DIR1)
    if (!fs.existsSync(dir1)){
        fs.mkdirSync(dir1);
    }
    const dir2 = resolve(DIR1, DIR2)
    if (!fs.existsSync(dir2)){
        fs.mkdirSync(dir2);
    }
    fs.writeFileSync(resolve(DIR1, DIR2, fname), fileData, err => {
        if (err) {
            console.error(err)
        }
    })
}

function getLastCacheModified(challenge) {
    return fs.statSync(resolve(DIR1, DIR2, `${challenge}.json`)).mtime
}

//////////////////////////////////////////////////////
// Parsing 
//////////////////////////////////////////////////////

async function fetchCombos(challenge, reload=false) {
    cacheFname = `${challenge}.json`
    let allCombos;
    if (hasCachedCombos(cacheFname) && !reload) {
        allCombos = await fetchCachedCombos(cacheFname)
    } else {
        allCombos = await scrapeAllCombos(challenge)
        cacheCombos(allCombos, cacheFname)
    }
    return allCombos
}

const { scrapeAll2TCCombos } = require('../services/index/2tc_scraper.js')
const { scrapeAll2MPCompletions } = require('../services/index/2mp_scraper.js');
const { scrapeAllFTTCCombos } = require('../services/index/fttc_scraper');

async function scrapeAllCombos(challenge) {
    switch(challenge) {
        case '2tc':
            return await scrapeAll2TCCombos();
        case '2mp':
            return await scrapeAll2MPCompletions();
        case 'fttc':
            return await scrapeAllFTTCCombos();
        default:
            throw 'Challenge not found'
    }
}

// Parses the map notes by splitting on comma and colon to get the map+person+link
function parseMapNotes(notes) {
    if (!notes) return {};
    return Object.fromEntries(
        notes
            .trim()
            .split('\n')
            .map((n) => {
                let altmap, altperson, altbitly;
                [altmap, altperson, altbitly] = n
                    .split(/[,:]/)
                    .map((t) => t.replace(/ /g, ''));

                return [
                    altmap,
                    {
                        PERSON: altperson,
                        LINK: `[${altbitly}](http://${altbitly})`,
                    },
                ];
            })
    );
}

//////////////////////////////////////////////////////
// Formatting 
//////////////////////////////////////////////////////

function altMapsFields(ogMapAbbr, allCompletedMapAbbrs, isWaterEntity) {
    const completedAltMaps = allCompletedMapAbbrs.filter(m => m != ogMapAbbr);

    let mapDifficultyGroups = [
        Aliases.beginnerMaps(),
        Aliases.intermediateMaps(),
        Aliases.advancedMaps(),
        Aliases.expertMaps(),
    ];
    if (isWaterEntity) {
        mapDifficultyGroups = mapDifficultyGroups.map((aliases) =>
            aliases.filter((map) => Aliases.allWaterMaps().includes(map))
        );
    }
    mapDifficultyGroups = mapDifficultyGroups.map((aliases) =>
        aliases.map((alias) => Aliases.mapToIndexAbbreviation(alias))
    );

    const altMapGroups = mapDifficultyGroups.map((mapGroup) =>
        mapGroup.filter((map) => completedAltMaps.includes(map))
    );
    const unCompletedAltMapGroups = mapDifficultyGroups.map((mapGroup) =>
        mapGroup.filter((map) => !completedAltMaps.concat(ogMapAbbr).includes(map))
    );

    let wordAllIncluded = false

    const displayedMapGroups = gHelper.range(0, altMapGroups.length - 1).map((i) => {
        mapDifficulty = ['BEG', 'INT', 'ADV', 'EXP'][i];
        waterTowerAsterisk = isWaterEntity ? '*' : '';
        if (unCompletedAltMapGroups[i] == 0) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk}`;
        } else if (unCompletedAltMapGroups[i].length < 5) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk} - {${unCompletedAltMapGroups[
                i
            ].join(', ')}}`;
        } else if (altMapGroups[i].length == 0) {
            return '';
        } else {
            return `{${altMapGroups[i].join(', ')}}`;
        }
    });
    
    let completedAltMapsString = '';
    if (displayedMapGroups.some(group => group.length > 0)) {
        completedAltMapsString += `\n${displayedMapGroups[0]}`;
        completedAltMapsString += `\n${displayedMapGroups[1]}`;
        completedAltMapsString += `\n${displayedMapGroups[2]}`;
        completedAltMapsString += `\n${displayedMapGroups[3]}`;
        completedAltMapsString;
    } else {
        completedAltMapsString = 'None';
    }

    completedAltMapsFooter = isWaterEntity && wordAllIncluded ? '*with water' : null

    return {
        field: completedAltMapsString,
        footer: completedAltMapsFooter
    }
}

module.exports = {
    hasCachedCombos,
    fetchCachedCombos,
    cacheCombos,
    getLastCacheModified,

    parseMapNotes,
    fetchCombos,

    altMapsFields,
}