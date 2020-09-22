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

function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return module.exports.helpMessage(message);
    }

    completionParser = 
        new AnyOrderParser(
            new OrParser(new TowerUpgradeParser(), new HeroParser()),
            new OrParser(
                new EmptyParser(), // OG completion for tower
                new MapParser(), // Completion of tower on specified map
                new MapDifficultyParser(), // Completions of tower on maps under specified difficulty
                new ExactStringParser('ALL') // All completions for tower
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
        return message.channel.send('Tower completion statistics in progress')
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
            'The OG 2MP completion for the specified tower.\n' +
                ' • Can either be `base_tower#\\d\\d\\d` (where \\d represents a digit).\n' +
                'or an upgrade name like `sentry_paragon`. Cannot combine both.\n' +
                ' • Upgrades must not include crosspathing.'
        )
        .addField(
            'Valid `<tower_upgrade>` values',
            '`pspike`, `spact#005`, `spike_factory#005`, `permaspike`, `perma-spike`, etc.'
        )
        .addField(
            'Invalid `<tower_upgrade>` values',
            'spact#025, permaspike#005'
        )
        .addField('Example', '`q!2mp gmn`');

    return message.channel.send(helpEmbed);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!2mp` for help', ':)')
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
    notes[ogMapAbbr] = {
        PERSON: ogPerson, 
        LINK: `[${ogLinkCell.value}](${ogLinkCell.hyperlink})`
    }
    notes = {
        ...notes,
        ...parseMapNotes(ogMapCell.note)
    };

    permittedMapAbbrs = Aliases[`${mapDifficulty}Maps`]().map(map => Aliases.mapToIndexAbbreviation(map));
    // Filter the completion entries by the permitted maps specified by the command-entered map difficulty
    relevantNotes = Object.keys(notes)
                          .filter(noteMapAbbr => permittedMapAbbrs.includes(noteMapAbbr))
                          .reduce((relevantNote, noteMapAbbr) => {
                              relevantNote[noteMapAbbr] = notes[noteMapAbbr];
                              return relevantNote
                          }, {});
    
    if (Object.keys(relevantNotes).length > 0) {
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
                .addField('Map', personColumn, true)
                .addField('Map', linkColumn, true)
        

        if (numCombosCompleted < numCombosPossible) {
            mapsLeft = permittedMapAbbrs.filter(pm => !Object.keys(relevantNotes).includes(pm))
            challengeEmbed.addField('Maps Left', mapsLeft.join(', '))
        }
                

        return message.channel.send(challengeEmbed);
    } else {
        throw new UserCommandError(
            `Tower \`${towerFormatted}\` has not yet been completed on any \`${mapDifficulty}\` maps`
        );
    }
}

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

module.exports = {
    name: '2mp',

    aliases: ['2m', '2mpc'],

    execute,
    helpMessage,
    errorMessage,
};
