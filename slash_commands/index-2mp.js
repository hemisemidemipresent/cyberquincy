const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const gHelper = require('../helpers/general.js');
const discordHelper = require('../helpers/discord')
const Index = require('../helpers/index.js');

const { paleblue } = require('../jsons/colours.json');
const { MessageActionRow, MessageButton, BaseGuildEmojiManager } = require('discord.js');

const COLS = {
    NUMBER: 'B',
    ENTITY: 'C',
    UPGRADE: 'E',
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

const { 
    SlashCommandBuilder, 
    SlashCommandStringOption,
} = require('@discordjs/builders');

const Towers = require('../helpers/towers');

CACHE_FNAME_2MP = '2mp.json'

let entityOption = 
    new SlashCommandStringOption()
        .setName('entity')
        .setDescription('Hero/Tower/Upgrade')
        .setRequired(false);

let mapOption = 
    new SlashCommandStringOption()
        .setName('map')
        .setDescription('Map/Difficulty')
        .setRequired(false);

let userOption =
    new SlashCommandStringOption()
        .setName('person')
        .setDescription('Person')
        .setRequired(false);

const reloadOption =
    new SlashCommandStringOption()
        .setName('reload')
        .setDescription('Do you need to reload completions from the index but for a much slower runtime?')
        .setRequired(false)
        .addChoice('Yes', 'yes')

builder = new SlashCommandBuilder()
    .setName('2mp')
    .setDescription('Search and Browse Completed 2MP Index Combos')
    .addStringOption(entityOption)
    .addStringOption(mapOption)
    .addStringOption(userOption)
    .addStringOption(reloadOption)

const OrParser = require('../parser/or-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');
const TowerParser = require('../parser/tower-parser.js')
const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const EmptyParser = require('../parser/empty-parser.js');
const Parsed = require('../parser/parsed.js');
const UserCommandError = require('../exceptions/user-command-error.js');
const PersonParser = require('../parser/person-parser.js');

function parseEntity(interaction) {
    entityParser = new OrParser(
        new TowerParser(),
        new TowerUpgradeParser(),
        new HeroParser(),
        new EmptyParser(),
    )
    entity = interaction.options.getString('entity')
    if (entity) {
        canonicalEntity = Aliases.getCanonicalForm(entity)
        if (canonicalEntity) {
            return CommandParser.parse([canonicalEntity], entityParser)
        } else {
            parsed = new Parsed()
            parsed.addError('Canonical not found')
            return parsed;
        }
    } else return new Parsed();
}

function parseMap(interaction) {
    mapParser = new OrParser(
        new MapParser(),
        new MapDifficultyParser(),
    )
    map = interaction.options.getString('map')
    if (map) {
        canonicalMap = Aliases.getCanonicalForm(map)
        if (canonicalMap) {
            return CommandParser.parse([canonicalMap], mapParser)
        } else {
            parsed = new Parsed()
            parsed.addError('Canonical not found')
            return parsed;
        }
    } else return new Parsed();
}

function parsePerson(interaction) {
    person = interaction.options.getString('person')?.toLowerCase()
    if (person) {
        return CommandParser.parse([`user#${person}`], new PersonParser())
    } else return new Parsed();
}

function parseAll(interaction) {
    parsedEntity = parseEntity(interaction)
    parsedMap = parseMap(interaction)
    person = parsePerson(interaction)
    return [parsedEntity, parsedMap, person];
}

function validateInput(interaction) {
    let [parsedEntity, parsedMap, parsedPerson] = parseAll(interaction)

    if (parsedEntity.hasErrors())
        return `Entity ${entity} didn't match tower/upgrade/hero, including aliases`

    if (parsedMap.hasErrors())
        return `Map/Difficulty ${map} didn't match, including aliases`
    
    if ((parsedEntity.tower_upgrade || parsedEntity.hero) && parsedMap.map && parsedPerson.person) {
        return "Don't search a person if you're already narrowing down your search to a specific completion"
    }
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({ 
            content: validationFailure, 
            ephemeral: true
        });
    }

    const parsed = parseAll(interaction).reduce(
        (combinedParsed, nextParsed) => combinedParsed.merge(nextParsed),
        new Parsed()
    )

    // Not cached
    if (parsed.tower && !parsed.map && !parsed.map_difficulty && !parsed.person) {
        const challengeEmbed = await display2MPTowerStatistics(parsed.tower)
        return interaction.reply({
            embeds: [challengeEmbed],
        })
    }

    await interaction.deferReply()

    const forceReload = interaction.options.getString('reload') ? true : false

    let allCombos;
    if (Index.hasCachedCombos(CACHE_FNAME_2MP) && !forceReload) {
        allCombos = await Index.fetchCachedCombos(CACHE_FNAME_2MP)           
    } else {
        allCombos = await scrapeAllCombos();
        Index.cacheCombos(allCombos, CACHE_FNAME_2MP)
    }

    const mtime = Index.getLastCacheModified(CACHE_FNAME_2MP)

    if ((parsed.tower_upgrade || parsed.hero) && !parsed.person) {
        const entity = parsed.hero || Towers.towerUpgradeToIndexNormalForm(parsed.tower_upgrade)
        const entityFormatted = Aliases.toIndexNormalForm(entity)
        const combo = allCombos.find(c => c.ENTITY == entityFormatted)

        let challengeEmbed;

        try {
            if (!combo) {
                throw new UserCommandError(
                    `Entity \`${entityFormatted}\` does not yet have a 2MP`
                );
            }

            if (parsed.map_difficulty) {
                challengeEmbed = embed2MPMapDifficulty(combo, parsed.map_difficulty)
            } else if (parsed.map) {
                challengeEmbed = embed2MPAlt(combo, parsed.map)
            } else {
                challengeEmbed = embed2MPOG(combo)
            }
            challengeEmbed.setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`)
        } catch(e) {
            challengeEmbed = err(e)
        }

        return await interaction.editReply({
            embeds: [challengeEmbed],
        })
    }

    try {
        return await display2MPFilterAll(interaction, allCombos, parsed, mtime)
    } catch(e) {
        return await interaction.editReply({ embeds: [err(e)] })
    }
}

async function scrapeAllCombos() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    // Load ENTITY and MAP columns
    let [startRow, endRow] = await rowBoundaries();
    await sheet.loadCells(`${COLS.NUMBER}${startRow}:${COLS.LINK}${endRow}`);

    let combos = []
    // Retrieve og- and alt-map notes from each tower row
    for (var row = startRow; row <= endRow; row++) {
        combos.push(
            parsePreloadedRow(row)
        );
    }

    return combos;
}

// Displays a 2MPC completion on the specified map
function embed2MPAlt(combo, map) {
    const mapFormatted = Aliases.toIndexNormalForm(map)
    const mapAbbr = Aliases.mapToIndexAbbreviation(map)

    const altCombo = combo.MAPS[mapAbbr]

    if (!altCombo) {
        throw new UserCommandError(
            `\`${combo.ENTITY}\` hasn't been completed yet on \`${mapFormatted}\``
        );
    }

    // Display OG map as if map weren't in the query
    if (altCombo.OG) {
        return embed2MPOG(combo);
    }

    // Embed and send the message
    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`${combo.ENTITY} 2MPC Combo on ${mapFormatted}`)
        .setColor(paleblue)
        .addField('Person', altCombo.PERSON, true)
        .addField('Link', altCombo.LINK, true);

    return challengeEmbed;
}

function ogCombo(combo) {
    return Object.entries(combo.MAPS).find( ([_, altCombo]) => {
        return altCombo.OG
    });
}

function orderAndFlatten2MPOGCompletion(combo) {
    let [ogMap, ogCompletion] = ogCombo(combo)
    combo = {
        ...combo,
        OG_MAP: Aliases.indexMapAbbreviationToNormalForm(ogMap),
        PERSON: ogCompletion.PERSON,
        LINK: ogCompletion.LINK,
    }

    const ordering = Object.keys(COLS)
    let orderedFields = {};
    ordering.forEach(col => orderedFields[col] = combo[col])
    return orderedFields;
}

function isWaterEntityCombo(combo) {
    const canonicalEntity = Aliases.toAliasCanonical(combo.ENTITY)
    return Towers.isWaterEntity(canonicalEntity)
}

function altMapDifficultyGroups(combo) {
    const ogMap = ogCombo(combo)[0]
    const completedAltMaps = Object.keys(combo.MAPS).filter(m => m != ogMap);

    let mapDifficultyGroups = [
        Aliases.beginnerMaps(),
        Aliases.intermediateMaps(),
        Aliases.advancedMaps(),
        Aliases.expertMaps(),
    ];
    if (isWaterEntityCombo(combo)) {
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
        mapGroup.filter((map) => !completedAltMaps.concat(ogMap).includes(map))
    );

    return [altMapGroups, unCompletedAltMapGroups]
}

// Displays the OG 2MPC completion
function embed2MPOG(combo) {
    const comboToEmbed = orderAndFlatten2MPOGCompletion(combo)

    // Embed and send the message
    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`${comboToEmbed.ENTITY} 2MPC Combo`)
        .setColor(paleblue);

    for (const field in comboToEmbed) {
        challengeEmbed.addField(
            gHelper.toTitleCase(field.replace('_', ' ')),
            comboToEmbed[field],
            true
        );
    }

    challengeEmbed.addField('OG?', 'OG', true);

    let [altMapGroups, unCompletedAltMapGroups] = altMapDifficultyGroups(combo)
    let wordAllIncluded = false

    const displayedMapGroups = gHelper.range(0, altMapGroups.length - 1).map((i) => {
        mapDifficulty = ['BEG', 'INT', 'ADV', 'EXP'][i];
        waterTowerAsterisk = isWaterEntityCombo(combo) ? '*' : '';
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

    if (displayedMapGroups.some(group => group.length > 0)) {
        completedAltMapsString = '';
        completedAltMapsString += `\n${displayedMapGroups[0]}`;
        completedAltMapsString += `\n${displayedMapGroups[1]}`;
        completedAltMapsString += `\n${displayedMapGroups[2]}`;
        completedAltMapsString += `\n${displayedMapGroups[3]}`;
        challengeEmbed.addField('**Alt Maps**', completedAltMapsString);
    } else {
        challengeEmbed.addField('**Alt Maps**', 'None');
    }

    if (isWaterEntityCombo(combo) && wordAllIncluded) {
        challengeEmbed.setFooter({ text: '*with water' });
    }

    return challengeEmbed;
}

// Displays all 2MPCs completed on all maps specified by the map difficulty
function embed2MPMapDifficulty(combo, mapDifficulty) {
    const mapDifficultyFormatted = Aliases.toIndexNormalForm(mapDifficulty);

    // Get all map abbreviations for the specified map difficulty
    const permittedMapAbbrs = Aliases[`${mapDifficulty}Maps`]().map((map) =>
        Aliases.mapToIndexAbbreviation(map)
    );

    const relevantMaps = Object.keys(combo.MAPS).filter(m => permittedMapAbbrs.includes(m))

    const numCombosCompleted = relevantMaps.length;

    if (numCombosCompleted == 0) {
        throw new UserCommandError(
            `\`${combo.ENTITY}\` has not yet been completed on any \`${mapDifficulty}\` maps`
        );
    }

    // Format 3 columns: map, person, link
    let mapColumn = [];
    let personColumn = [];
    let linkColumn = [];
    for (const mapAbbr of relevantMaps) {
        const bold = combo.MAPS[mapAbbr].OG ? '**' : '';

        mapColumn.push(
            `${bold}${Aliases.indexMapAbbreviationToNormalForm(mapAbbr)}${bold}`
        );
        personColumn.push(`${bold}${combo.MAPS[mapAbbr].PERSON}${bold}`);
        linkColumn.push(`${bold}${combo.MAPS[mapAbbr].LINK}${bold}`);
    }
    mapColumn = mapColumn.join('\n');
    personColumn = personColumn.join('\n');
    linkColumn = linkColumn.join('\n');

    let mapsLeft = permittedMapAbbrs.filter(
        (m) => !Object.keys(combo.MAPS).includes(m)
    );

    // Check if tower is water tower
    let impossibleMaps = [];
    if (isWaterEntityCombo(combo)) {
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
            `${combo.ENTITY} 2MPCs on ${mapDifficultyFormatted} Maps`
        )
        .setColor(paleblue);

    const numCombosPossible = permittedMapAbbrs.length - impossibleMaps.length;
    let possiblePhrasing;
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

    challengeEmbed.setFooter({ text: '----\nOG completion bolded' });

    return challengeEmbed;
}

function filterCombo(c, parsed) {
    const matchesPerson = parsed.person ? parsed.person === c.PERSON.toLowerCase() : true

    let matchesEntity = true
    if (parsed.tower) {
        if (Towers.isTowerUpgrade(c.ENTITY)) {
            matchesEntity = Towers.towerUpgradeToTower(c.ENTITY) == parsed.tower;
        } else { // Hero
            matchesEntity = false
        }
    } else if (parsed.tower_upgrade || parsed.hero) { // Tower upgrade or hero
        matchesEntity = c.ENTITY == (parsed.tower_upgrade || parsed.hero);
    }

    let matchesMap = true
    if (parsed.map_difficulty) {
        matchesMap = Aliases.allMapsFromMapDifficulty(parsedMap.map_difficulty).includes(c.MAP)
    } else if (parsed.map) { // Map
        matchesMap = parsedMap.map == c.MAP
    }

    const matchesOg = parsed.hasAny() ? true : c.OG

    return matchesPerson && matchesEntity && matchesMap && matchesOg
}

function titleFunction(parsed, noCombos=false) {
    let title;
    if (noCombos) {
        title = 'No 2MPs Completed'
    } else {
        title = 'All 2MPs'
    }

    if (parsed.tower) {
        title += ` with ${Aliases.toIndexNormalForm(parsed.tower)}`
    } else if (parsed.tower_upgrade) {
        title += ` with ${Towers.towerUpgradeToIndexNormalForm(parsed.tower_upgrade)}`
    } else if (parsed.hero) {
        title += ` with ${Aliases.toIndexNormalForm(parsed.hero)}`
    }

    if (parsed.map) {
        title += ` on ${Aliases.toIndexNormalForm(parsed.map)}`
    } else if (parsed.map_difficulty) {
        title += ` on ${Aliases.toIndexNormalForm(parsed.map_difficulty)} maps`
    }

    if (parsed.person) {
        title += ` by ${parsed.person}`
    }

    return title;
}

function determineExcludedColumns(parsed) {
    let excludedColumns = []

    if (parsed.tower_upgrade || parsed.hero) {
        excludedColumns.push('entity')
    }

    if (parsed.map) {
        excludedColumns.push('map')
    }

    if (parsed.person || !parsed.hasAny()) {
        excludedColumns.push('person')
    }

    if (!parsed.tower_upgrade && !parsed.hero && !parsed.map && !parsed.person) {
        excludedColumns.push('person')
    }

    return excludedColumns;
}

async function display2MPFilterAll(interaction, combos, parsed, mtime) {
    // Collect data from 4 columns: tower, map, person, link
    // Only 3 can be used maximum to format a discord embed
    let towerColumn = [];
    let personColumn = [];
    let linkColumn = [];
    let mapColumn = [];

    let numOGCompletions = 0;

    // Retrieve og- and alt-map notes from each tower row
    for (const combo of combos) {
        for (const map in combo.MAPS) {
            const mapCompletion = combo.MAPS[map]

            const canonicalCompletion = {
                ENTITY: Aliases.toAliasCanonical(combo.ENTITY),
                MAP: Aliases.indexMapAbbreviationToMap(map),
                PERSON: mapCompletion.PERSON,
                LINK: mapCompletion.LINK,
                OG: mapCompletion.OG || false
            };

            if (!filterCombo(canonicalCompletion, parsed)) {
                continue;
            }

            const bold = mapCompletion.OG ? '**' : '';
            if (mapCompletion.OG) numOGCompletions += 1;

            towerColumn.push(`${bold}${combo.ENTITY}${bold}`);
            mapColumn.push(`${bold}${map}${bold}`);
            linkColumn.push(`${bold}${mapCompletion.LINK}${bold}`);
            personColumn.push(`${bold}${mapCompletion.PERSON}${bold}`);
        }
    }

    // If no combos were found after filtering
    if (towerColumn.length == 0) {
        throw new UserCommandError(
            titleFunction(parsed, true)
        );
    }

    const title = titleFunction(parsed);

    const excludedColumns = determineExcludedColumns(parsed)

    // Exclude columns from data output based on function input
    let columns = {};
    if (!excludedColumns.includes('entity')) columns.ENTITY = towerColumn;
    if (!excludedColumns.includes('map')) columns.MAP = mapColumn;
    if (!excludedColumns.includes('person')) columns.PERSON = personColumn;
    columns.LINK = linkColumn;

    return await embedPages(interaction, title, columns, numOGCompletions, mtime);
}

const MULTIPAGE_BUTTONS_2MP = new MessageActionRow().addComponents(
    new MessageButton().setCustomId('-1').setLabel('⬅️').setStyle('PRIMARY'),
    new MessageButton().setCustomId('1').setLabel('➡️').setStyle('PRIMARY'),
);

//  If >MAX_VALUES_LIST_LENGTH_2MP combos are found, it paginates the results; navigation is driven by emoji reactions
async function embedPages(interaction, title, columns, numOGCompletions, mtime) {
    const numRows = columns.LINK.length
    let leftIndex = 0;
    let rightIndex = Math.min(MAX_VALUES_LIST_LENGTH_2MP, numRows) - 1

    async function embedPage(direction) {
        for (
            maxNumRowsDisplayed = MAX_VALUES_LIST_LENGTH_2MP;
            maxNumRowsDisplayed > 0;
            maxNumRowsDisplayed--
        ) {
            let challengeEmbed = new Discord.MessageEmbed()
                .setTitle(title)
                .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`)
                .setColor(paleblue)
                .addField(
                    '# Combos',
                    `**${leftIndex + 1}**-**${rightIndex + 1}** of ${numRows}`
                );

            for (columnHeader in columns) {
                challengeEmbed.addField(
                    columnHeader,
                    columns[columnHeader].slice(leftIndex, rightIndex + 1).join('\n'),
                    true
                );
            }

            if (numOGCompletions == 1) {
                challengeEmbed.setFooter({ text: `---\nOG completion bolded` });
            }
            if (numOGCompletions > 1) {
                challengeEmbed.setFooter({
                    text: `---\n${numOGCompletions} total OG completions bolded`
                });
            }

            if (discordHelper.isValidFormBody(challengeEmbed)) {
                return [ challengeEmbed, numRows > maxNumRowsDisplayed ]
            }

            if (direction > 0) rightIndex--;
            if (direction < 0) leftIndex++;
        }
    }
    
    async function displayPage(direction) {
        let [challengeEmbed, multipage] = await embedPage(direction)

        await interaction.editReply({
            embeds: [challengeEmbed],
            components: [MULTIPAGE_BUTTONS_2MP]
        });

        if (!multipage) return;

        const filter = (selection) => {
            // Ensure user clicking button is same as the user that started the interaction
            if (selection.user.id !== interaction.user.id) {
                return false;
            }
            // Ensure that the button press corresponds with this interaction and wasn't
            // a button press on the previous interaction
            if (selection.message.interaction.id !== interaction.id) {
                return false;
            }
            return true;
        }

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: 'BUTTON',
            time: 20000,
        });
        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            buttonInteraction.deferUpdate();

            switch (parseInt(buttonInteraction.customId)) {
                case -1:
                    rightIndex = (leftIndex - 1 + numRows) % numRows;
                    leftIndex = rightIndex - (MAX_VALUES_LIST_LENGTH_2MP - 1);
                    if (leftIndex < 0) leftIndex = 0;
                    await displayPage(-1)
                    break;
                case 1:
                    leftIndex = (rightIndex + 1) % numRows;
                    rightIndex = leftIndex + (MAX_VALUES_LIST_LENGTH_2MP - 1);
                    if (rightIndex >= numRows) rightIndex = numRows - 1;
                    await displayPage(1);
                    break;
            }
        });

        collector.on('end', async (collected) => {
            if (collected.size == 0) {
                await interaction.editReply({
                    embeds: [challengeEmbed],
                    components: []
                });
            }
        });
    }

    displayPage(1);
}

// Assumes appropriate cells are loaded beforehand!
function parsePreloadedRow(row) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    const ogMapCell = sheet.getCellByA1(`${COLS.OG_MAP}${row}`);
    const ogMapAbbr = Aliases.mapToIndexAbbreviation(
        Aliases.toAliasNormalForm(ogMapCell.value)
    );
    const ogPerson = sheet.getCellByA1(`${COLS.PERSON}${row}`).value;
    const ogLinkCell = sheet.getCellByA1(`${COLS.LINK}${row}`);

    let notes = {};
    // Add OG map to list of maps completed
    notes[ogMapAbbr] = {
        PERSON: ogPerson,
        LINK: `[${ogLinkCell.value}](${ogLinkCell.hyperlink})`,
        OG: true,
    };
    // Add rest of maps found in notes
    const maps = {
        ...notes,
        ...parseMapNotes(ogMapCell.note),
    };

    let completion = {}
    for (const col of ["NUMBER", "ENTITY", "UPGRADE", "VERSION"]) {
        completion[col] = sheet.getCellByA1(`${COLS[col]}${row}`).value;
    }
    completion.DATE = sheet.getCellByA1(`${COLS.DATE}${row}`).formattedValue;

    completion.MAPS = maps;

    return completion
}

function err(e) {
    // TODO: The errors being caught here aren't UserCommandErrors, more like ComboErrors
    if (e instanceof UserCommandError) {
        return new Discord.MessageEmbed()
            .setTitle(e.message)
            .setColor(paleblue);
    } else {
        throw e;
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
async function display2MPTowerStatistics(tower) {
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
        .setColor(paleblue)
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

    return challengeEmbed;
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
        let towerCandidate = sheet.getCellByA1(
            `${TOWER_COLS.TOWER}${row}`
        ).value;

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

module.exports = {
    data: builder,
    execute,
}
