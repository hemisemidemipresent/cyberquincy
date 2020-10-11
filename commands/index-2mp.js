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
const DeveloperCommandError = require('../exceptions/developer-command-error.js');

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
};

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);
RED_X = String.fromCharCode(10060);

function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return helpMessage(message);
    }

    completionParser = new AnyOrderParser(
        new OrParser(new TowerUpgradeParser(), new HeroParser()),
        new OrParser(
            new MapParser(), // Completion of tower on specified map
            new MapDifficultyParser(), // Completions of tower on maps under specified difficulty
            new ExactStringParser('ALL'), // All completions for tower
            new EmptyParser() // OG completion for tower
        )
    );

    towerCompletionParser = new TowerParser();
    allTowersOnGivenMapParser = new MapParser();

    const parsed = CommandParser.parse(
        args,
        new OrParser(
            completionParser,
            towerCompletionParser,
            allTowersOnGivenMapParser
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
    } else if (parsed.map) {
        return display2MPMap(message, parsed.map).catch((e) =>
            err(e, message)
        );
    } else if (parsed.tower) {
        // 0-0-0 tower name provided
        return display2MPTowerStatistics(message, parsed.tower).catch((e) =>
            err(e, message)
        );
    } else {
        return message.channel.send('Feature yet to be decided');
    }

    if (parsed.map) {
        // tower + map
        return display2MPAlt(message, tower, parsed.map).catch((e) =>
            err(e, message)
        );
    } else if (parsed.exact_string) {
        // tower on all maps
        // TODO
        return message.channel.send('Feature in progress');
    } else if (parsed.map_difficulty) {
        // tower on maps under specified difficulty
        // TODO
        return display2MPMapDifficulty(
            message,
            tower,
            parsed.map_difficulty
        ).catch((e) => err(e, message));
    } else {
        // tower (OG completion)
        return display2MPOG(message, tower).catch((e) => err(e, message));
    }
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!2mp` HELP')
        .addField(
            '`q!2mp <tower_upgrade>`',
            'The OG 2MPC completion for the specified tower.\n' + '`q!2mp wlp`'
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
        );

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
    await sheet.loadCells(`${COLS.NUMBER}${entryRow}:${COLS.LINK}${entryRow}`);

    // Assign each value to be discord-embedded in a simple default way
    values = {};
    for (key in COLS) {
        values[key] = sheet.getCellByA1(`${COLS[key]}${entryRow}`).value;
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

    mapFormatted = h.toTitleCase(map.split('_').join(' '));
    towerFormatted = h.toTitleCase(tower.split('_').join(' '));

    entryRow = await rowFromTower(tower);

    // Load the map cell, the only cell that likely matters
    await sheet.loadCells(
        `${COLS.OG_MAP}${entryRow}:${COLS.OG_MAP}${entryRow}`
    );

    ogMapCell = sheet.getCellByA1(`${COLS.OG_MAP}${entryRow}`);
    ogMap = ogMapCell.value;

    // Display OG map as if map weren't in the query
    if (mapFormatted == ogMap) {
        return display2MPOG(message, tower);
    }

    notes = parseMapNotes(ogMapCell.note);

    // Tower has been completed on queried map if the map abbreviation can be found in the notes
    if ((altCompletion = notes[Aliases.mapToIndexAbbreviation(map)])) {
        // Embed and send the message
        let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(`${towerFormatted} 2MPC Combo on ${mapFormatted}`)
            .setColor(colours['cyber'])
            .addField('Person', altCompletion.PERSON, true)
            .addField('Link', altCompletion.LINK, true);

        message.channel.send(challengeEmbed);
    } else {
        throw new UserCommandError(
            `Tower \`${towerFormatted}\` has not yet been completed on \`${mapFormatted}\``
        );
    }
}

MAX_VALUES_LIST_LENGTH_2MP = 15;

async function display2MPMap(message, map) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    mapFormatted = Aliases.toIndexNormalForm(map);

    // Load TOWER and MAP columns
    [startRow, endRow] = await rowBoundaries();
    await sheet.loadCells(`${COLS.TOWER}${startRow}:${COLS.LINK}${endRow}`)

    mapAbbr = Aliases.mapToIndexAbbreviation(map)

    // Format 3 columns: map, person, link
    towerColumn = [];
    personColumn = [];
    linkColumn = [];

    // Retrieve alt-map notes from each tower row
    for (var row = startRow; row <= endRow; row++) {
        towerCell = sheet.getCellByA1(`${COLS.TOWER}${row}`);

        towerMapNotes = parsePreloadedMapNotesWithOG(row);
        singleMapNotes = towerMapNotes[mapAbbr]

        if(!singleMapNotes) continue;

        towerColumn.push(towerCell.value)
        personColumn.push(singleMapNotes.PERSON)
        linkColumn.push(singleMapNotes.LINK)
    }

    if (towerColumn.length == 0) {
        return message.channel.send(`No combos on ${mapFormatted}`)
    }

    title = `All 2MPCs on ${mapFormatted}`;

    if (towerColumn.length > MAX_VALUES_LIST_LENGTH_2MP) {
        return embedPages(message, towerColumn, personColumn, linkColumn, title)
    }

    let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(title)
            .setColor(colours['cyber']);
    
    challengeEmbed
        .addField('Tower', towerColumn.join("\n"), true)
        .addField('Person', personColumn.join("\n"), true)
        .addField('Link', linkColumn.join("\n"), true);
    
    return message.channel.send(challengeEmbed);
}

//  If >MAX_VALUES_LIST_LENGTH_2MP combos are found, it paginates the results; navigation is driven by emoji reactions
function embedPages(message, towers, persons, links, title) {
    towerChunks = h.chunk(towers, MAX_VALUES_LIST_LENGTH_2MP);
    personChunks = h.chunk(persons, MAX_VALUES_LIST_LENGTH_2MP);
    linkChunks = h.chunk(links, MAX_VALUES_LIST_LENGTH_2MP);

    // Divide results into chunks of MAX_VALUES_LIST_LENGTH_2MP
    numPages = towerChunks.length;
    pg = 0;

    REACTIONS = ['⬅️', '➡️', '❌'];
    // Gets the reaction to the pagination message by the command author
    // and respond appropriate action (turning page or deleting message)
    function reactLoop(msg) {
        // Lays out predefined reactions
        for (var i = 0; i < REACTIONS.length; i++) {
            msg.react(REACTIONS[i]);
        }

        // Read author reaction (time limit specified below in milliseconds)
        // and respond with appropriate action
        msg.createReactionCollector(
            (reaction, user) =>
                user.id === message.author.id &&
                REACTIONS.includes(reaction.emoji.name),
            { time: 20000 }
        ).once('collect', (reaction) => {
            switch (reaction.emoji.name) {
                case '⬅️':
                    pg--;
                    break;
                case '➡️':
                    pg++;
                    break;
                case '❌':
                default:
                    return msg.delete();
            }
            pg += numPages; // Avoid negative numbers
            pg %= numPages; // Avoid page numbers greater than max page number
            displayCurrentPage();
        });
    }

    function displayCurrentPage() {
        challengeEmbed = new Discord.MessageEmbed()
            .setTitle(title)
            .setColor(colours['cyber'])
            .addField('#Combos', towers.length)
            .addField('Tower', towerChunks[pg].join("\n"), true)
            .addField('Person', personChunks[pg].join("\n"), true)
            .addField('Link', linkChunks[pg].join("\n"), true)
            .setFooter(`${pg + 1}/${numPages}`);

        message.channel.send(challengeEmbed).then((msg) => reactLoop(msg));
    }

    displayCurrentPage();
}

// Displays all 2MPCs completed on all maps specified by the map difficulty
async function display2MPMapDifficulty(message, tower, mapDifficulty) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    mapDifficultyFormatted = h.toTitleCase(mapDifficulty);
    towerFormatted = h.toTitleCase(tower.split('_').join(' '));

    entryRow = await rowFromTower(tower);

    // Load the map cell, person cell, link cell and a few in between
    await sheet.loadCells(`${COLS.OG_MAP}${entryRow}:${COLS.LINK}${entryRow}`);

    notes = parsePreloadedMapNotesWithOG(entryRow);

    // Get all map abbreviations for the specified map difficulty
    permittedMapAbbrs = Aliases[`${mapDifficulty}Maps`]().map((map) =>
        Aliases.mapToIndexAbbreviation(map)
    );
    // Filter the completion entries by the permitted maps specified by the command-entered map difficulty
    relevantNotes = Object.keys(notes)
        .filter((noteMapAbbr) => permittedMapAbbrs.includes(noteMapAbbr))
        .reduce((relevantNote, noteMapAbbr) => {
            relevantNote[noteMapAbbr] = notes[noteMapAbbr];
            return relevantNote;
        }, {});

    numCombosCompleted = Object.keys(relevantNotes).length;

    if (numCombosCompleted > 0) {
        // Format 3 columns: map, person, link
        mapColumn = [];
        personColumn = [];
        linkColumn = [];
        for (const mapAbbr in relevantNotes) {
            mapColumn.push(Aliases.indexAbbreviationToMap(mapAbbr));
            personColumn.push(relevantNotes[mapAbbr].PERSON);
            linkColumn.push(relevantNotes[mapAbbr].LINK);
        }
        mapColumn = mapColumn.join('\n');
        personColumn = personColumn.join('\n');
        linkColumn = linkColumn.join('\n');

        mapsLeft = permittedMapAbbrs.filter(
            (m) => !Object.keys(relevantNotes).includes(m)
        );

        // Check if tower is water tower
        impossibleMaps = [];
        if (
            Aliases.allWaterTowers().includes(
                Aliases.towerUpgradeToTower(tower)
            )
        ) {
            // Calculate impossible maps (those that do not contain any water)
            nonWaterMaps = Aliases.allNonWaterMaps().map((m) =>
                Aliases.mapToIndexAbbreviation(m)
            );
            impossibleMaps = mapsLeft.filter((m) => nonWaterMaps.includes(m));

            mapsLeft = mapsLeft.filter((m) => !impossibleMaps.includes(m));
        }

        // Embed and send the message
        let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(
                `${towerFormatted} 2MPCs on ${mapDifficultyFormatted} Maps`
            )
            .setColor(colours['cyber']);

        numCombosPossible = permittedMapAbbrs.length - impossibleMaps.length;
        if (mapsLeft.length > 0) {
            possiblePhrasing =
                impossibleMaps.length > 0 ? ' (that are possible)' : '';
            challengeEmbed.addField(
                `Combos${possiblePhrasing}`,
                `**${numCombosCompleted}**/${numCombosPossible}`
            );
        } else {
            possiblePhrasing = impossibleMaps.length > 0 ? ' possible' : '';
            challengeEmbed.addField(
                `All${possiblePhrasing} ${mapDifficulty} maps completed`,
                '-'.repeat(40)
            );
        }

        challengeEmbed
            .addField('Map', mapColumn, true)
            .addField('Person', personColumn, true)
            .addField('Link', linkColumn, true);

        if (impossibleMaps.length > 0) {
            challengeEmbed.addField(
                'Impossible maps',
                impossibleMaps.join(', ')
            );
        }

        if (mapsLeft.length > 0) {
            challengeEmbed.addField('Maps Left', mapsLeft.join(', '));
        }

        return message.channel.send(challengeEmbed);
    } else {
        throw new UserCommandError(
            `Tower \`${towerFormatted}\` has not yet been completed on any \`${mapDifficulty}\` maps`
        );
    }
}

async function rowBoundaries() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');
    await sheet.loadCells(`${COLS.NUMBER}1:${COLS.NUMBER}${sheet.rowCount}`);

    startRow = null
    endRow = null

    for (let row = 1; row <= sheet.rowCount; row++) {
        numberCandidate = sheet.getCellByA1(`${COLS.NUMBER}${row}`).value;

        // If startRow has been found, find the first occurence of a blank cell
        if (startRow && !numberCandidate) {
            endRow = row - 1;
            break;
        } else if (numberCandidate && numberCandidate.replace(/ /g, '') === '1st') {
            startRow = row;
        }
    }

    if (!startRow) {
        throw new DeveloperCommandError(`Orientation failed because \`1st\` couldn't be found in the "Number" column.`)
    }

    // If there wasn't a trailing blank cell, then the last cell viewed must be the end cell
    if (!endRow) endRow = sheet.rowCount;

    return [startRow, endRow];
}

// Gets the row of tower completion stats for the given tower
async function rowFromTower(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    [rowBegin, rowEnd] = await rowBoundaries();

    // Load the column containing the different maps
    await sheet.loadCells(`${COLS.TOWER}${rowBegin}:${COLS.TOWER}${rowEnd}`); // loads all possible cells with tower

    // The row where the queried map is found
    let entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = rowBegin; row <= rowEnd; row++) {
        let towerCandidate = sheet.getCellByA1(`${COLS.TOWER}${row}`).value;

        if (!towerCandidate) continue;

        // input is "in_the_loop" but needs to be compared to "In The Loop"
        if (
            Aliases.toIndexNormalForm(tower) === h.toTitleCase(towerCandidate)
        ) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw new UserCommandError(
            `Tower \`${Aliases.toIndexNormalForm(
                tower
            )}\` doesn't yet have a 2MP completion`
        );
    }

    return entryRow;
}

// Assumes appropriate cells are loaded beforehand!
function parsePreloadedMapNotesWithOG(row) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    ogMapCell = sheet.getCellByA1(`${COLS.OG_MAP}${row}`);
    ogMapAbbr = Aliases.mapToIndexAbbreviation(
        Aliases.toAliasNormalForm(ogMapCell.value)
    );
    ogPerson = sheet.getCellByA1(`${COLS.PERSON}${row}`).value;
    ogLinkCell = sheet.getCellByA1(`${COLS.LINK}${row}`);

    notes = {};
    // Add OG map to list of maps completed
    notes[ogMapAbbr] = {
        PERSON: ogPerson,
        LINK: `[${ogLinkCell.value}](${ogLinkCell.hyperlink})`,
    };
    // Add rest of maps found in notes
    return {
        ...notes,
        ...parseMapNotes(ogMapCell.note),
    };
}

// Parses the map notes by splitting on comma and colon to get the map+person+link
function parseMapNotes(notes) {
    if (!notes) return {};
    return Object.fromEntries(
        notes.split('\n').map((n) => {
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
    baseTowerCompletionMarking = await getCompletionMarking(entryRow, null, 2);

    const towerFormatted = Aliases.toIndexNormalForm(tower);

    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`2MPC Completions for ${towerFormatted}`)
        .setColor(colours['cyber'])
        .addField('\u200b', '\u200b', true) // Left column placeholder
        .addField('Base Tower', baseTowerCompletionMarking, true) // Base tower
        .addField('\u200b', '\u200b', true); // Right column placeholder

    for (var tier = 3; tier <= 5; tier++) {
        for (var path = 1; path <= 3; path++) {
            towerUpgradeName = Aliases.towerUpgradeFromTowerAndPathAndTier(
                tower,
                path,
                tier
            );
            upgradeCompletionMarking = await getCompletionMarking(
                entryRow,
                path,
                tier
            );
            challengeEmbed.addField(
                towerUpgradeName,
                upgradeCompletionMarking,
                true
            );
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
        upgradeCol = TOWER_COLS.BASE;
    } else {
        upgradeCol = String.fromCharCode(
            TOWER_COLS.BASE.charCodeAt(0) + (path - 1) * 3 + tier - 2
        );
    }

    completion = sheet.getCellByA1(`${upgradeCol}${entryRow}`).value.trim();

    if (completion == HEAVY_CHECK_MARK) {
        return WHITE_HEAVY_CHECK_MARK;
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
            `Tower \`${Aliases.toIndexNormalForm(
                tower
            )}\` doesn't yet have a 2MP completion`
        );
    }

    return entryRow;
}

module.exports = {
    name: '2mp',

    aliases: ['2m', '2mpc'],
    dependencies: ['btd6index'],
    execute,
    helpMessage,
    errorMessage,
};
