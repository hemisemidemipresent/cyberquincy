const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const OrParser = require('../parser/or-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');

const EmptyParser = require('../parser/empty-parser.js');
const MapParser = require('../parser/map-parser.js');
const ExactStringParser = require('../parser/exact-string-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const TowerParser = require('../parser/tower-parser.js');
const AnyOrderParser = require('../parser/any-order-parser.js');
const UserCommandError = require('../exceptions/user-command-error.js');

const COLS = {
    NUMBER: 'B',
    TOWER: 'C',
    UPGRADES: 'E',
    OG_MAP: 'F',
    VERSION: 'H',
    DATE: 'I',
    PERSON: 'J',
    LINK: 'L',
};

const TOWER_COLS = {
    TOWER: 'O',
    BASE: 'P',
    LAST: 'Y',
}

const WATER_TOWERS = [
    'sub',
    'bucc',
    'brickell',
]

const NO_WATER_MAPS = [
    'TS',
    'H',
    'AR',
    'MM',
    'ML',
    'KD',
    'BZ',
    'HA',
    'R',
    'CF',
    'GD',
    'UG',
    'MS',
    'W'
]

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);
RED_X = String.fromCharCode(10060);

function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return helpMessage(message);
    }

    completionParser = 
        new AnyOrderParser(
            new OrParser(new TowerUpgradeParser(), new HeroParser()),
            new OrParser(
                new MapParser(), // Completion of tower on specified map
                new MapDifficultyParser(), // Completions of tower on maps under specified difficulty
                new ExactStringParser('ALL'), // All completions for tower
                new EmptyParser() // OG completion for tower
            )
        )
    
    towerCompletionParser = new TowerParser()
    allTowersOnGivenMapParser = new MapParser()

    const parsed = CommandParser.parse(
        args,
        new OrParser(
            completionParser,
            towerCompletionParser,
            allTowersOnGivenMapParser,
        )
    );

    if (parsed.hasErrors()) {
        return module.exports.errorMessage(message, parsed.parsingErrors);
    }

    let tower = null;
    if (parsed.tower_upgrade) {
        // The index-standard representation for a tower upgrade
        // is stored as the first alias (not including the canonical)
        tower = Aliases.getAliasSet(parsed.tower_upgrade)[1];
    } else if (parsed.hero) {
        tower = parsed.hero;
    } else if (parsed.map) { // Only map is provided, no tower
        return message.channel.send('All-tower completions on a given map coming soon')
    } else if (parsed.tower) { // 0-0-0 tower name provided
        return display2MPTowerStatistics(message, parsed.tower).catch(e => err(e, message));
    } else {
        return message.channel.send("Feature yet to be decided")
    }

    if (parsed.map) { // tower + map
        return display2MPAlt(message, tower, parsed.map).catch(e => err(e, message))
    } else if (parsed.exact_string) { // tower on all maps
        // TODO
        return message.channel.send('Feature in progress');
    } else if (parsed.map_difficulty) { // tower on maps under specified difficulty
        // TODO
        return display2MPMapDifficulty(message, tower, parsed.map_difficulty).catch(e => err(e, message))
    } else { // tower (OG completion)
        return display2MPOG(message, tower).catch(e => err(e, message));
    }
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!2mp` HELP')
        .addField(
            '`q!2mp <tower_upgrade>`',
            'The OG 2MPC completion for the specified tower.\n' + 
            '`q!2mp wlp`'
        )
        .addField(
            '`q!2mp <tower_upgrade> <map>`',
            'The Alt-Map 2MPC completion for the specified tower and map.\n' +
            '`q!2mp dartship another-brick`'
        )
        .addField(
            '`q!2mp <tower_upgrade> <map_difficulty>`',
            'All 2MPC completions for the specified tower on maps that fall under the specified map difficulty.\n' +
            '`q!2mp savatar expert`'
        )

    return message.channel.send(helpEmbed);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!2mp` for help', '\u200b')
        .setColor(colours['orange']);

    return message.channel.send(errorEmbed);
}

function err(e, message) {
    if (e instanceof UserCommandError) {
        return module.exports.errorMessage(message, [e.message]);
    } else {
        throw e;
    }
}

// Displays the OG 2MPC completion
async function display2MPOG(message, tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    entryRow = await rowFromTower(tower);

    // Load the row where the map was found
    await sheet.loadCells(
        `${COLS.NUMBER}${entryRow}:${COLS.LINK}${entryRow}`
    );

    // Assign each value to be discord-embedded in a simple default way
    values = {};
    for (key in COLS) {
        values[key] = sheet.getCellByA1(
            `${COLS[key]}${entryRow}`
        ).value;
    }

    // Special formatting for date (get formattedValue instead)
    dateCell = sheet.getCellByA1(`${COLS.DATE}${entryRow}`);
    values.DATE = dateCell.formattedValue;

    // Special handling for link (use hyperlink to cleverly embed in discord)
    linkCell = sheet.getCellByA1(`${COLS.LINK}${entryRow}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    // Embed and send the message
    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`${values.TOWER} 2MPC Combo`)
        .setColor(colours['cyber']);

    for (field in values) {
        challengeEmbed.addField(
            h.toTitleCase(field.replace('_', ' ')),
            values[field],
            true
        );
    }

    challengeEmbed.setFooter('~~~~~~~~~~~~~~~  OG Map  ~~~~~~~~~~~~~~~~~~~');

    return message.channel.send(challengeEmbed);
}

// Displays a 2MPC completion on the specified map
async function display2MPAlt(message, tower, map) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    mapFormatted = h.toTitleCase(map.split('_').join(' '))
    towerFormatted = h.toTitleCase(tower.split('_').join(' '))

    entryRow = await rowFromTower(tower);

    // Load the map cell, the only cell that likely matters
    await sheet.loadCells(
        `${COLS.OG_MAP}${entryRow}:${COLS.OG_MAP}${entryRow}`
    );

    ogMapCell = sheet.getCellByA1(`${COLS.OG_MAP}${entryRow}`);
    ogMap = ogMapCell.value

    // Display OG map as if map weren't in the query
    if (mapFormatted == ogMap) {
        return display2MPOG(message, tower);
    }

    notes = parseMapNotes(ogMapCell.note);

    // Tower has been completed on queried map if the map abbreviation can be found in the notes
    if (altCompletion = notes[Aliases.mapToIndexAbbreviation(map)]) {
        // Embed and send the message
        let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(`${towerFormatted} 2MPC Combo on ${mapFormatted}`)
            .setColor(colours['cyber'])
            .addField('Person', altCompletion.PERSON, true)
            .addField('Link', altCompletion.LINK, true)

        message.channel.send(challengeEmbed);
    } else {
        throw new UserCommandError(
            `Tower \`${towerFormatted}\` has not yet been completed on \`${mapFormatted}\``
        );
    }
}

// Displays all 2MPCs completed on all maps specified by the map difficulty
async function display2MPMapDifficulty(message, tower, mapDifficulty) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    mapDifficultyFormatted = h.toTitleCase(mapDifficulty)
    towerFormatted = h.toTitleCase(tower.split('_').join(' '))

    entryRow = await rowFromTower(tower);

    // Load the map cell, person cell, link cell and a few in between
    await sheet.loadCells(
        `${COLS.OG_MAP}${entryRow}:${COLS.LINK}${entryRow}`
    );

    ogMapCell = sheet.getCellByA1(`${COLS.OG_MAP}${entryRow}`);
    ogMapAbbr = Aliases.mapToIndexAbbreviation(ogMapCell.value.split(' ').join('_'))
    ogPerson = sheet.getCellByA1(`${COLS.PERSON}${entryRow}`).value;
    ogLinkCell = sheet.getCellByA1(`${COLS.LINK}${entryRow}`);

    notes = {}
    // Add OG map to list of maps completed
    notes[ogMapAbbr] = {
        PERSON: ogPerson, 
        LINK: `[${ogLinkCell.value}](${ogLinkCell.hyperlink})`
    }
    // Add rest of maps found in notes
    notes = {
        ...notes,
        ...parseMapNotes(ogMapCell.note)
    };

    // Get all map abbreviations for the specified map difficulty
    permittedMapAbbrs = Aliases[`${mapDifficulty}Maps`]().map(map => Aliases.mapToIndexAbbreviation(map));
    // Filter the completion entries by the permitted maps specified by the command-entered map difficulty
    relevantNotes = Object.keys(notes)
                          .filter(noteMapAbbr => permittedMapAbbrs.includes(noteMapAbbr))
                          .reduce((relevantNote, noteMapAbbr) => {
                              relevantNote[noteMapAbbr] = notes[noteMapAbbr];
                              return relevantNote
                          }, {});
    
    if (Object.keys(relevantNotes).length > 0) {
        // Format 3 columns: map, person, link
        mapColumn = []
        personColumn = []
        linkColumn = []
        for (const mapAbbr in relevantNotes) {
            mapColumn.push(Aliases.indexAbbreviationToMap(mapAbbr))
            personColumn.push(relevantNotes[mapAbbr].PERSON)
            linkColumn.push(relevantNotes[mapAbbr].LINK)
        }
        mapColumn = mapColumn.join("\n");
        personColumn = personColumn.join("\n")
        linkColumn = linkColumn.join("\n")

        // Embed and send the message
        let challengeEmbed = new Discord.MessageEmbed()
                .setTitle(`${towerFormatted} 2MPCs on ${mapDifficultyFormatted} Maps`)
                .setColor(colours['cyber'])
        
        numCombosCompleted = Object.keys(relevantNotes).length
        numCombosPossible = permittedMapAbbrs.length

        if (numCombosPossible == numCombosCompleted) {
            challengeEmbed.addField(`All ${mapDifficulty} maps completed`, '-'.repeat(40))
        } else {
            challengeEmbed.addField('Combos', `**${numCombosCompleted}**/${numCombosPossible}`)
        }
        
        challengeEmbed.addField('Map', mapColumn, true)
                .addField('Person', personColumn, true)
                .addField('Link', linkColumn, true)

        mapsLeft = permittedMapAbbrs.filter(pm => !Object.keys(relevantNotes).includes(pm))
        impossibleMaps = []

        // Check if tower is water tower
        if (WATER_TOWERS.map(wt => Aliases.getCanonicalForm(wt))
                        .includes(Aliases.towerUpgradeToTower(tower))) {
            // List impossible maps (those that do not contain any water)
            impossibleMaps = mapsLeft.filter(m => NO_WATER_MAPS.includes(m))
            challengeEmbed.addField('Impossible maps', impossibleMaps.join(', '))

            mapsLeft = mapsLeft.filter(m => !impossibleMaps.includes(m))
        }
        
        if (mapsLeft.length > 0) {
            challengeEmbed.addField('Maps Left', mapsLeft.join(', '))
        }
                
        return message.channel.send(challengeEmbed);
    } else {
        throw new UserCommandError(
            `Tower \`${towerFormatted}\` has not yet been completed on any \`${mapDifficulty}\` maps`
        );
    }
}

// Gets the row of tower completion stats for the given tower
async function rowFromTower(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    // Load the column containing the different maps
    await sheet.loadCells(
        `${COLS.TOWER}1:${COLS.TOWER}${sheet.rowCount}`
    ); // loads all possible cells with tower

    // The row where the queried map is found
    let entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= sheet.rowCount; row++) {
        let towerCandidate = sheet.getCellByA1(`${COLS.TOWER}${row}`)
                                  .value;

        if (!towerCandidate) continue;

        // input is "in_the_loop" but needs to be compared to "In The Loop"
        if (Aliases.toIndexNormalForm(tower) === h.toTitleCase(towerCandidate)) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw new UserCommandError(
            `Tower \`${Aliases.toIndexNormalForm(tower)}\` doesn't yet have a 2MP completion`
        );
    }

    return entryRow;
}

// Parses the map notes by splitting on comma and colon to get the map+person+link
function parseMapNotes(notes) {
    if (!notes) return {}
    return Object.fromEntries(
        notes.split("\n").map(n => {
            let altmap, altperson, altbitly
            [altmap, altperson, altbitly] = n.split(/[,:]/).map(t => t.replace(/ /g, ''));
            
            return [altmap, 
                {
                    PERSON: altperson, 
                    LINK: `[${altbitly}](http://${altbitly})`
                }]
        })
    );
}

// Displays a 3x3 grid completion checkboxes/x'es for each upgrade+tier above base
// Also displays base
async function display2MPTowerStatistics(message, tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    entryRow = await findTowerRow(tower);

    // Load the row where the map was found
    await sheet.loadCells(
        `${TOWER_COLS.TOWER}${entryRow}:${TOWER_COLS.LAST}${entryRow}`
    );

    // Check or X
    baseTowerCompletionMarking = await getCompletionMarking(entryRow, null, 2)

    const towerFormatted = Aliases.toIndexNormalForm(tower);
    
    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`2MPC Completions for ${towerFormatted}`)
        .setColor(colours['cyber'])
        .addField('\u200b', '\u200b', true) // Left column placeholder
        .addField('Base Tower', baseTowerCompletionMarking, true) // Base tower
        .addField('\u200b', '\u200b', true) // Right column placeholder
    
    for (var path = 1; path <= 3; path++) {
        for (var tier = 3; tier <=5; tier++) {
            towerUpgradeName = Aliases.towerUpgradeFromTowerAndPathAndTier(tower, path, tier);
            upgradeCompletionMarking = await getCompletionMarking(entryRow, path, tier)
            challengeEmbed.addField(towerUpgradeName, upgradeCompletionMarking, true)
        }
    }

    message.channel.send(challengeEmbed);
}

// Converts the Index's marking of whether a tower's path/tier has been completed
// to symbols that are recognizable on the discord embed level
async function getCompletionMarking(entryRow, path, tier) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    upgradeCol = null;

    if (tier == 2) {
        upgradeCol = TOWER_COLS.BASE
    } else {
        upgradeCol = String.fromCharCode(TOWER_COLS.BASE.charCodeAt(0) + (path - 1)*3 + tier - 2)
    }

    completion = sheet.getCellByA1(`${upgradeCol}${entryRow}`).value.trim()

    if(completion == HEAVY_CHECK_MARK) {
        return WHITE_HEAVY_CHECK_MARK
    } else {
        return RED_X;
    }
}

async function findTowerRow(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    // Load the column containing the different towers
    await sheet.loadCells(
        `${TOWER_COLS.TOWER}1:${TOWER_COLS.TOWER}${sheet.rowCount}`
    );

    entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= sheet.rowCount; row++) {
        let towerCandidate = sheet.getCellByA1(`${TOWER_COLS.TOWER}${row}`)
                                  .value;

        if (!towerCandidate) continue;

        if (Aliases.towerUpgradeToIndexNormalForm(tower) == towerCandidate) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw new UserCommandError(
            `Tower \`${Aliases.toIndexNormalForm(tower)}\` doesn't yet have a 2MP completion`
        );
    }

    return entryRow;
}

module.exports = {
    name: '2mp',

    aliases: ['2m', '2mpc'],

    execute,
    helpMessage,
    errorMessage,
};
