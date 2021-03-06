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
const PersonParser = require('../parser/person-parser.js');

const gHelper = require('../helpers/general.js');

const CHALLENGE_COLOR = '#6d9eeb';

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
    personParser = new PersonParser();

    const parsed = CommandParser.parse(
        args,
        new OrParser(
            completionParser,
            towerCompletionParser,
            allTowersOnGivenMapParser,
            personParser
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
        return display2MPMap(message, parsed.map).catch((e) => err(e, message));
    } else if (parsed.tower) {
        // 0-0-0 tower name provided
        return display2MPTowerStatistics(message, parsed.tower).catch((e) =>
            err(e, message)
        );
    } else if (parsed.person) {
        return display2MPPerson(message, parsed.person).catch((e) =>
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
            '`q!2mp <tower_upgrade/hero>`',
            'The OG 2MPC completion for the specified tower upgrade or hero.\n' +
                '`q!2mp wlp` / `q!2mp pat`'
        )
        .addField(
            '`q!2mp <map>`',
            'All 2MPC completions on the specified map.\n' + '`q!2mp inf`'
        )
        .addField(
            '`q!2mp <user>`',
            'All 2MPC completions (including alt maps) by the specified user.\n' +
                '`q!2mp u#rmlgaming`'
        )
        .addField(
            '`q!2mp <tower>`',
            'The path-completion statistics for a given tower.\n' +
                '`q!2mp wiz`'
        )
        .addField(
            'Further usages',
            '`q!2mp dartship another_brick`\n' +
                '`q!2mp prime expert`\n' +
                '`q!2mp sav dc`'
        )
        .setColor(CHALLENGE_COLOR);

    return message.channel.send(helpEmbed);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('Input Error')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!2mp` for help', '\u200b')
        .setColor(colours['orange']);

    return message.channel.send(errorEmbed);
}

function err(e, message) {
    // TODO: The errors being caught here aren't UserCommandErrors, more like ComboErrors
    if (e instanceof UserCommandError) {
        let noComboEmbed = new Discord.MessageEmbed()
                .setTitle(e.message)
                .setColor(CHALLENGE_COLOR);
        return message.channel.send(noComboEmbed);
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
        .setColor(CHALLENGE_COLOR);

    for (field in values) {
        challengeEmbed.addField(
            gHelper.toTitleCase(field.replace('_', ' ')),
            values[field],
            true
        );
    }

    challengeEmbed.addField("OG?", "OG", true);

    mapCell = sheet.getCellByA1(`${COLS.OG_MAP}${entryRow}`);
    altMaps = Object.keys(parseMapNotes(mapCell.note));
    ogMap = Aliases.mapToIndexAbbreviation(Aliases.toAliasNormalForm(values.OG_MAP));

    mapGroups = [Aliases.beginnerMaps(), Aliases.intermediateMaps(), Aliases.advancedMaps(), Aliases.expertMaps()]
    if (Towers.isWaterTowerUpgrade(tower)) {
        mapGroups = mapGroups.map(aliases => aliases.filter(map => Aliases.allWaterMaps().includes(map)))
    }
    mapGroups = mapGroups.map(aliases => aliases.map(alias => Aliases.mapToIndexAbbreviation(alias)));
    
    altMapGroups = mapGroups.map(mapGroup => mapGroup.filter(map => altMaps.includes(map)));
    unCompletedAltMapGroups = mapGroups.map(mapGroup => mapGroup.filter(map => !altMaps.concat(ogMap).includes(map)));

    wordAllIncluded = false;

    displayedMapGroups = gHelper.range(0, altMapGroups.length - 1).map(i => {
        mapDifficulty = ["BEG", "INT", "ADV", "EXP"][i];
        waterTowerAsterisk = Towers.isWaterTowerUpgrade(tower) ? '*' : '';
        if (unCompletedAltMapGroups[i] == 0) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk}`;
        } else if (unCompletedAltMapGroups[i].length < 3) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk} - {${unCompletedAltMapGroups[i].join(', ')}}`;
        } else if (altMapGroups[i].length == 0) {
            return '';
        } else {
            return `{${altMapGroups[i].join(', ')}}`;
        }
    })

    if (altMapGroups.some(group => group.length > 0)) {
        altMapsString = ""
        altMapsString += `\n${displayedMapGroups[0]}`;
        altMapsString += `\n${displayedMapGroups[1]}`;
        altMapsString += `\n${displayedMapGroups[2]}`;
        altMapsString += `\n${displayedMapGroups[3]}`;
        challengeEmbed.addField(
            "**Alt Maps**",
            altMapsString
        )
    } else {
        challengeEmbed.addField("**Alt Maps**", "None");
    }

    if (Towers.isWaterTowerUpgrade(tower) && wordAllIncluded) {
        challengeEmbed.setFooter("*with water")
    }

    return message.channel.send(challengeEmbed);
}

// Displays a 2MPC completion on the specified map
async function display2MPAlt(message, tower, map) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    mapFormatted = gHelper.toTitleCase(map.split('_').join(' '));
    towerFormatted = gHelper.toTitleCase(tower.split('_').join(' '));

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
            .setColor(CHALLENGE_COLOR)
            .addField('Person', altCompletion.PERSON, true)
            .addField('Link', altCompletion.LINK, true);

        message.channel.send(challengeEmbed);
    } else {
        throw new UserCommandError(
            `Tower \`${towerFormatted}\` has not yet been completed on \`${mapFormatted}\``
        );
    }
}

MAX_VALUES_LIST_LENGTH_2MP = 12;

async function display2MPPerson(message, person) {
    return await display2MPFilterAll(
        message,
        function filterCombo(c) {
            return c.PERSON.toLowerCase() === person;
        },
        function titleClarification(c) {
            return `All 2MPCs by ${c.PERSON}`;
        },
        `No 2MPCs by \`${person}\` found`,
        ['person']
    );
}

async function display2MPMap(message, map) {
    mapFormatted = Aliases.toIndexNormalForm(map);
    mapAbbr = Aliases.mapToIndexAbbreviation(map);

    if (map == 'logs') {
        return message.channel.send("Sorry, `q!map logs` is broken right now b/c the links are so long it reaches the character limit of even a strict pagination")
    }

    return await display2MPFilterAll(
        message,
        function filterCombo(c) {
            return c.MAP === mapAbbr;
        },
        function titleClarification(_) {
            return `All 2MPCs on ${mapFormatted}`;
        },
        `No 2MPCs on \`${mapFormatted}\` found`,
        ['map']
    );
}

async function display2MPFilterAll(
    message,
    conditional,
    titleFunction,
    noCombosMessage,
    excludedColumns
) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    // Load TOWER and MAP columns
    [startRow, endRow] = await rowBoundaries();
    await sheet.loadCells(`${COLS.TOWER}${startRow}:${COLS.LINK}${endRow}`);

    // Collect data from 4 columns: tower, map, person, link
    // Only 3 can be used maximum to format a discord embed
    towerColumn = [];
    personColumn = [];
    linkColumn = [];
    mapColumn = [];

    // Retrieve og- and alt-map notes from each tower row
    for (var row = startRow; row <= endRow; row++) {
        towerCell = sheet.getCellByA1(`${COLS.TOWER}${row}`);

        towerMapNotes = parsePreloadedMapNotesWithOG(row);
        for (map in towerMapNotes) {
            note = {
                MAP: map,
                ...towerMapNotes[map],
            };

            if (!conditional(note)) {
                continue;
            }

            towerColumn.push(towerCell.value);
            mapColumn.push(note.MAP);
            linkColumn.push(note.LINK);
            personColumn.push(note.PERSON);
        }
    }

    // Format the title using the method passed in and the first filtered combo found
    title = titleFunction({
        TOWER: towerColumn[0],
        PERSON: personColumn[0],
        MAP: mapColumn[0],
        LINK: linkColumn[0],
    });

    // If no combos were found after filtering
    if (towerColumn.length == 0) {
        return message.channel.send(noCombosMessage);
    }

    // Exclude columns from data output based on function input
    columns = {};
    columns.TOWER = towerColumn;
    if (!excludedColumns.includes('map')) columns.MAP = mapColumn;
    if (!excludedColumns.includes('person')) columns.PERSON = personColumn;
    columns.LINK = linkColumn;

    // Paginate if there are too many combos to display at once
    if (columns.TOWER.length > MAX_VALUES_LIST_LENGTH_2MP) {
        return embedPages(message, title, columns);
    }

    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(title)
        .addField('#Combos', columns.LINK.length)
        .setColor(CHALLENGE_COLOR);

    // Display the non-excluded columns
    for (columnHeader in columns) {
        challengeEmbed.addField(
            gHelper.toTitleCase(columnHeader),
            columns[columnHeader].join('\n'),
            true
        );
    }

    return message.channel.send(challengeEmbed);
}

//  If >MAX_VALUES_LIST_LENGTH_2MP combos are found, it paginates the results; navigation is driven by emoji reactions
function embedPages(message, title, columns) {
    columnChunks = {};
    for (columnHeader in columns) {
        columnChunks[columnHeader] = gHelper.chunk(
            columns[columnHeader],
            MAX_VALUES_LIST_LENGTH_2MP
        );
    }

    // Divide results into chunks of MAX_VALUES_LIST_LENGTH_2MP
    numPages = columnChunks.LINK.length;
    pg = 0;

    REACTIONS = ['⬅️', '➡️'];
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
                default:
                    return msg.delete();
            }
            pg += numPages; // Avoid negative numbers
            pg %= numPages; // Avoid page numbers greater than max page number
            displayCurrentPage(msg);
        });
    }

    async function displayCurrentPage(msg) {
        challengeEmbed = new Discord.MessageEmbed()
            .setTitle(title)
            .setColor(CHALLENGE_COLOR)
            .addField('#Combos', columns.LINK.length)
            .setFooter(`${pg + 1}/${numPages}`);

        for (columnHeader in columnChunks) {
            challengeEmbed.addField(
                columnHeader,
                columnChunks[columnHeader][pg].join('\n'),
                true
            );
        }

        if (msg) {
            try {
                await msg.reactions.cache
                    .get('⬅️')
                    .users.remove(message.author.id);
                await msg.reactions.cache
                    .get('➡️')
                    .users.remove(message.author.id);
            } catch (e) {
                if (
                    e.code === Discord.Constants.APIErrors.MISSING_PERMISSIONS
                ) {
                    return message.channel
                        .send(challengeEmbed)
                        .then((m) => reactLoop(m));
                } else {
                    throw e;
                }
            }
            msg.edit(challengeEmbed).then((msg) => reactLoop(msg));
        } else
            message.channel.send(challengeEmbed).then((msg) => reactLoop(msg));
    }

    displayCurrentPage();
}

// Displays all 2MPCs completed on all maps specified by the map difficulty
async function display2MPMapDifficulty(message, tower, mapDifficulty) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    mapDifficultyFormatted = gHelper.toTitleCase(mapDifficulty);
    towerFormatted = gHelper.toTitleCase(tower.split('_').join(' '));

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
        if (Towers.isWaterTowerUpgrade(tower)) {
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
            .setColor(CHALLENGE_COLOR);

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

    startRow = null;
    endRow = null;

    for (let row = 1; row <= sheet.rowCount; row++) {
        numberCandidate = sheet.getCellByA1(`${COLS.NUMBER}${row}`).value;

        // If startRow has been found, find the first occurence of a blank cell
        if (startRow && !numberCandidate) {
            endRow = row - 1;
            break;
        } else if (
            numberCandidate &&
            numberCandidate.replace(/ /g, '') === '1st'
        ) {
            startRow = row;
        }
    }

    if (!startRow) {
        throw new DeveloperCommandError(
            `Orientation failed because \`1st\` couldn't be found in the "Number" column.`
        );
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
            Aliases.toIndexNormalForm(tower) ===
            gHelper.toTitleCase(towerCandidate)
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
        .setColor(CHALLENGE_COLOR)
        .addField('\u200b', '\u200b', true) // Left column placeholder
        .addField('Base Tower', baseTowerCompletionMarking, true) // Base tower
        .addField('\u200b', '\u200b', true); // Right column placeholder

    for (var tier = 3; tier <= 5; tier++) {
        for (var path = 1; path <= 3; path++) {
            towerUpgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(
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

        if (Towers.towerUpgradeToIndexNormalForm(tower) == towerCandidate) {
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
