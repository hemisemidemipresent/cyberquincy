const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const gHelper = require('../helpers/general.js');
const Index = require('../helpers/index.js');
const Towers = require('../helpers/towers');
const Maps = require('../helpers/maps')

const { paleblue } = require('../jsons/colors.json');

const Parsed = require('../parser/parsed.js');

const { COLS } = require('../services/index/2mp_scraper');

const TOWER_COLS = {
    TOWER: 'O',
    BASE: 'P',
    LAST: 'Y'
};

const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

let entityOption = new SlashCommandStringOption().setName('entity').setDescription('Hero/Tower/Upgrade').setRequired(false);

let mapOption = new SlashCommandStringOption().setName('map').setDescription('Map/Difficulty').setRequired(false);

let userOption = new SlashCommandStringOption().setName('person').setDescription('Person').setRequired(false);

const reloadOption = new SlashCommandStringOption()
    .setName('reload')
    .setDescription('Do you need to reload completions from the index but for a much slower runtime?')
    .setRequired(false)
    .addChoices({ name: 'Yes', value: 'yes' });

builder = new SlashCommandBuilder()
    .setName('2mp')
    .setDescription('Search and Browse Completed 2MP Index Combos')
    .addStringOption(entityOption)
    .addStringOption(mapOption)
    .addStringOption(userOption)
    .addStringOption(reloadOption);

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });

    const parsed = parseAll(interaction).reduce(
        (combinedParsed, nextParsed) => combinedParsed.merge(nextParsed),
        new Parsed()
    );

    // Not cached
    if (parsed.tower && !parsed.map && !parsed.map_difficulty && !parsed.person) {
        const challengeEmbed = await display2MPTowerStatistics(parsed.tower);
        return await interaction.reply({
            embeds: [challengeEmbed]
        });
    }

    await interaction.deferReply();

    const forceReload = interaction.options.getString('reload') ? true : false;

    const allCombos = await Index.fetchInfo('2mp', forceReload);

    const mtime = Index.getLastCacheModified('2mp');

    if ((parsed.tower_upgrade || parsed.hero) && !parsed.person) {
        const entity = parsed.hero || Towers.towerUpgradeToIndexNormalForm(parsed.tower_upgrade);
        const entityFormatted = Aliases.toIndexNormalForm(entity);
        const combo = allCombos.find((c) => c.ENTITY.toLowerCase() == entityFormatted.toLowerCase());

        let challengeEmbed;

        try {
            if (!combo) {
                throw new UserCommandError(`Entity \`${entityFormatted}\` does not yet have a 2MP`);
            }

            if (parsed.map_difficulty) {
                challengeEmbed = embed2MPMapDifficulty(combo, parsed.map_difficulty);
            } else if (parsed.map) {
                challengeEmbed = embed2MPAlt(combo, parsed.map);
            } else {
                challengeEmbed = embed2MPOG(combo);
            }
            challengeEmbed.setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`);
        } catch (e) {
            challengeEmbed = err(e);
        }

        return await interaction.editReply({
            embeds: [challengeEmbed]
        });
    }

    try {
        return await display2MPFilterAll(interaction, allCombos, parsed, mtime);
    } catch (e) {
        return await interaction.editReply({ embeds: [err(e)] });
    }
}

////////////////////////////////////////////////////////////
// Parsing SlashCommand Input
////////////////////////////////////////////////////////////

function validateInput(interaction) {
    let [parsedEntity, parsedMap, parsedPerson] = parseAll(interaction);

    if (parsedEntity.hasErrors()) {
        return `Entity didn't match tower/upgrade/hero, including aliases`;
    }

    if (parsedMap.hasErrors()) return `Map/Difficulty didn't match, including aliases`;

    if ((parsedEntity.tower_upgrade || parsedEntity.hero) && parsedMap.map && parsedPerson.person) {
        return "Don't search a person if you're already narrowing down your search to a specific completion";
    }
}

function parseAll(interaction) {
    const parsedEntity = parseEntity(interaction);
    const parsedMap = parseMap(interaction);
    const person = parsePerson(interaction);
    return [parsedEntity, parsedMap, person];
}

const OrParser = require('../parser/or-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');
const TowerParser = require('../parser/tower-parser.js');
const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const PersonParser = require('../parser/person-parser.js');

const UserCommandError = require('../exceptions/user-command-error.js');
const DeveloperCommandError = require('../exceptions/developer-command-error.js');

function parseEntity(interaction) {
    const entityParser = new OrParser(new TowerParser(), new TowerUpgradeParser(), new HeroParser());
    const entity = interaction.options.getString('entity');
    if (entity) {
        const canonicalEntity = Aliases.canonicizeArg(entity);
        if (canonicalEntity) {
            let parsed = CommandParser.parse([canonicalEntity], entityParser);
            // Alias tier 1 and 2 towers to base tower
            if (parsed.tower_upgrade) {
                const [, tier] = Towers.pathTierFromUpgradeSet(Towers.towerUpgradeToUpgrade(parsed.tower_upgrade));
                if (tier < 3) {
                    const tower = Towers.towerUpgradeToTower(parsed.tower_upgrade);
                    parsed = CommandParser.parse([`${tower}#222`], entityParser);
                }
            }
            return parsed;
        } else {
            const parsed = new Parsed();
            parsed.addError('Canonical not found');
            return parsed;
        }
    } else return new Parsed();
}

function parseMap(interaction) {
    const mapParser = new OrParser(new MapParser(), new MapDifficultyParser());
    const map = interaction.options.getString('map');
    if (map) {
        const canonicalMap = Aliases.getCanonicalForm(map);
        if (canonicalMap) {
            return CommandParser.parse([canonicalMap], mapParser);
        } else {
            const parsed = new Parsed();
            parsed.addError('Canonical not found');
            return parsed;
        }
    } else return new Parsed();
}

function parsePerson(interaction) {
    const person = interaction.options.getString('person')?.toLowerCase();
    if (person) {
        return CommandParser.parse([`user#${person}`], new PersonParser());
    } else return new Parsed();
}

////////////////////////////////////////////////////////////
// 2MP OG
////////////////////////////////////////////////////////////

function embed2MPOG(combo) {
    const comboToEmbed = orderAndFlatten2MPOGCompletion(combo);

    // Embed and send the message
    let challengeEmbed = new Discord.EmbedBuilder().setTitle(`${comboToEmbed.ENTITY} 2MPC Combo`).setColor(paleblue);

    for (const field in comboToEmbed) {
        challengeEmbed.addFields([
            { name: gHelper.toTitleCase(field.replace('_', ' ')), value: comboToEmbed[field], inline: true }
        ]);
    }

    challengeEmbed.addFields([{ name: 'OG?', value: 'OG', inline: true }]);

    const ogMapAbbr = ogCombo(combo)[0];
    let completedAltMapsFields = Index.altMapsFields(ogMapAbbr, Object.keys(combo.MAPS), Maps.mapsNotPossible(combo.ENTITY));

    challengeEmbed.addFields([{ name: '**Alt Maps**', value: completedAltMapsFields.field }]);

    if (completedAltMapsFields.footer) {
        challengeEmbed.setFooter({ text: completedAltMapsFields.footer });
    }

    return challengeEmbed;
}

function orderAndFlatten2MPOGCompletion(combo) {
    let [ogMap, ogCompletion] = ogCombo(combo);
    combo = {
        ...combo,
        OG_MAP: Maps.indexMapAbbreviationToNormalForm(ogMap),
        PERSON: ogCompletion.PERSON,
        LINK: ogCompletion.LINK
    };

    const ordering = Object.keys(COLS);
    let orderedFields = {};
    ordering.forEach((col) => (orderedFields[col] = combo[col]));
    return orderedFields;
}

function ogCombo(combo) {
    return Object.entries(combo.MAPS).find(([_, altCombo]) => {
        return altCombo.OG;
    });
}

////////////////////////////////////////////////////////////
// 2MP Alt Map
////////////////////////////////////////////////////////////

function embed2MPAlt(combo, map) {
    const mapFormatted = Aliases.toIndexNormalForm(map);
    const mapAbbr = Maps.mapToIndexAbbreviation(map);

    const altCombo = combo.MAPS[mapAbbr];

    if (!altCombo) {
        throw new UserCommandError(`\`${combo.ENTITY}\` hasn't been completed yet on \`${mapFormatted}\``);
    }

    // Display OG map as if map weren't in the query
    if (altCombo.OG) {
        return embed2MPOG(combo);
    }

    // Embed and send the message
    let challengeEmbed = new Discord.EmbedBuilder()
        .setTitle(`${combo.ENTITY} 2MPC Combo on ${mapFormatted}`)
        .setColor(paleblue)
        .addFields([
            { name: 'Person', value: altCombo.PERSON, inline: true },
            { name: 'Link', value: altCombo.LINK, inline: true }
        ]);

    return challengeEmbed;
}

////////////////////////////////////////////////////////////
// 2MP Map Difficulty
////////////////////////////////////////////////////////////

// Displays all 2MPCs completed on all maps specified by the map difficulty
function embed2MPMapDifficulty(combo, mapDifficulty) {
    const mapDifficultyFormatted = Aliases.toIndexNormalForm(mapDifficulty);

    // Get all map abbreviations for the specified map difficulty
    const permittedMapAbbrs = Maps.allMapsFromMapDifficulty(mapDifficulty).map((map) => Maps.mapToIndexAbbreviation(map));

    const relevantMaps = Object.keys(combo.MAPS).filter((m) => permittedMapAbbrs.includes(m));

    const numCombosCompleted = relevantMaps.length;

    if (numCombosCompleted == 0) {
        throw new UserCommandError(`\`${combo.ENTITY}\` has not yet been completed on any \`${mapDifficulty}\` maps`);
    }

    // Format 3 columns: map, person, link
    let mapColumn = [];
    let personColumn = [];
    let linkColumn = [];
    for (const mapAbbr of relevantMaps) {
        const bold = combo.MAPS[mapAbbr].OG ? '**' : '';

        mapColumn.push(`${bold}${Maps.indexMapAbbreviationToNormalForm(mapAbbr)}${bold}`);
        personColumn.push(`${bold}${combo.MAPS[mapAbbr].PERSON}${bold}`);
        linkColumn.push(`${bold}${combo.MAPS[mapAbbr].LINK}${bold}`);
    }
    mapColumn = mapColumn.join('\n');
    personColumn = personColumn.join('\n');
    linkColumn = linkColumn.join('\n');

    let mapsLeft = permittedMapAbbrs.filter((m) => !Object.keys(combo.MAPS).includes(m));

    // Check if tower is water tower
    const impossibleMaps = Maps.mapsNotPossible(combo.ENTITY).filter(m => permittedMapAbbrs.includes(m))
    mapsLeft = mapsLeft.filter((m) => !impossibleMaps.includes(m));

    // Embed and send the message
    let challengeEmbed = new Discord.EmbedBuilder()
        .setTitle(`${combo.ENTITY} 2MPCs on ${mapDifficultyFormatted} Maps`)
        .setColor(paleblue);

    const numCombosPossible = permittedMapAbbrs.length - impossibleMaps.length;
    let possiblePhrasing;
    if (mapsLeft.length > 0) {
        possiblePhrasing = impossibleMaps.length > 0 ? ' (where placement is possible)' : '';
        challengeEmbed.addFields([
            { name: `Combos${possiblePhrasing}`, value: `**${numCombosCompleted}**/${numCombosPossible}` }
        ]);
    } else {
        possiblePhrasing = impossibleMaps.length > 0 ? ' possible' : '';
        challengeEmbed.addFields([
            { name: `All${possiblePhrasing} ${mapDifficulty} maps completed`, value: '-'.repeat(40) }
        ]);
    }

    challengeEmbed.addFields([
        { name: 'Map', value: mapColumn, inline: true },
        { name: 'Person', value: personColumn, inline: true },
        { name: 'Link', value: linkColumn, inline: true }
    ]);

    if (impossibleMaps.length > 0) {
        challengeEmbed.addFields([{ name: 'Impossible maps', value: impossibleMaps.join(', ') }]);
    }

    if (mapsLeft.length > 0) {
        challengeEmbed.addFields([{ name: 'Maps Left', value: mapsLeft.join(', ') }]);
    }

    challengeEmbed.setFooter({ text: '----\nOG completion bolded' });

    return challengeEmbed;
}

////////////////////////////////////////////////////////////
// Custom Multipage Queries
////////////////////////////////////////////////////////////

async function display2MPFilterAll(interaction, combos, parsed, mtime) {
    // Collect data from 4 columns: tower, map, person, link
    // Only 3 can be used maximum to format a discord embed
    let towerColumn = [];
    let personColumn = [];
    let linkColumn = [];
    let mapColumn = [];

    let numOGCompletions = 0;
    let erroredYet = false

    // Retrieve og- and alt-map notes from each tower row
    for (const combo of combos) {
        for (const map in combo.MAPS) {
            const mapCompletion = combo.MAPS[map];

            const canonicalCompletion = {
                ENTITY: Aliases.toAliasCanonical(combo.ENTITY),
                MAP: Maps.indexMapAbbreviationToMap(map),
                PERSON: mapCompletion.PERSON,
                LINK: mapCompletion.LINK,
                OG: mapCompletion.OG || false
            };

            if (!canonicalCompletion.MAP && !erroredYet) {
                interaction.reply({content: `Index Entry Error: ${map} is not a valid quincybot map abbreviation (check ${combo.ENTITY})`})
                erroredYet = true
                continue
            }

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
        throw new UserCommandError(titleFunction(parsed, true));
    }

    const title = titleFunction(parsed);

    const excludedColumns = determineExcludedColumns(parsed);

    // Exclude columns from data output based on function input
    let columns = {};
    if (!excludedColumns.includes('entity')) columns.ENTITY = towerColumn;
    if (!excludedColumns.includes('map')) columns.MAP = mapColumn;
    if (!excludedColumns.includes('person')) columns.PERSON = personColumn;
    columns.LINK = linkColumn;

    function setOtherDisplayFields(challengeEmbed) {
        challengeEmbed
            .setTitle(title)
            .setColor(paleblue)
            .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`);

        if (numOGCompletions == 1) {
            challengeEmbed.setFooter({ text: `---\nOG completion bolded` });
        }
        if (numOGCompletions > 1) {
            challengeEmbed.setFooter({
                text: `---\n${numOGCompletions} total OG completions bolded`
            });
        }
    }

    return await Index.displayOneOrMultiplePages(interaction, columns, setOtherDisplayFields);
}

function filterCombo(c, parsed) {
    const matchesPerson = parsed.person ? parsed.person === c.PERSON.toLowerCase() : true;

    let matchesEntity = true;
    if (parsed.tower) {
        if (Aliases.isHero(c.ENTITY)) {
            matchesEntity = false;
        } else {
            matchesEntity = Towers.towerUpgradeToTower(c.ENTITY) == parsed.tower;
        }
    } else if (parsed.tower_upgrade || parsed.hero) {
        // Tower upgrade or hero
        matchesEntity = c.ENTITY == (parsed.tower_upgrade || parsed.hero);
    }

    let matchesMap = true;
    if (parsed.map_difficulty) {
        matchesMap = Maps.allMapsFromMapDifficulty(parsed.map_difficulty).includes(c.MAP);
    } else if (parsed.map) {
        // Map
        matchesMap = parsed.map == c.MAP;
    }

    const matchesOg = parsed.hasAny() ? true : c.OG;

    return matchesPerson && matchesEntity && matchesMap && matchesOg;
}

function titleFunction(parsed, noCombos = false) {
    let title;
    if (noCombos) {
        title = 'No 2MPs Completed';
    } else {
        title = 'All 2MPs';
    }

    if (parsed.tower) {
        title += ` with ${Aliases.toIndexNormalForm(parsed.tower)}`;
    } else if (parsed.tower_upgrade) {
        title += ` with ${Towers.towerUpgradeToIndexNormalForm(parsed.tower_upgrade)}`;
    } else if (parsed.hero) {
        title += ` with ${Aliases.toIndexNormalForm(parsed.hero)}`;
    }

    if (parsed.map) {
        title += ` on ${Aliases.toIndexNormalForm(parsed.map)}`;
    } else if (parsed.map_difficulty) {
        title += ` on ${Aliases.toIndexNormalForm(parsed.map_difficulty)} maps`;
    }

    if (parsed.person) {
        title += ` by ${parsed.person}`;
    }

    return title;
}

function determineExcludedColumns(parsed) {
    let excludedColumns = [];

    if (parsed.tower_upgrade || parsed.hero) {
        excludedColumns.push('entity');
    }

    if (parsed.map) {
        excludedColumns.push('map');
    }

    if (parsed.person || !parsed.hasAny()) {
        excludedColumns.push('person');
    }

    if (!parsed.tower_upgrade && !parsed.hero && !parsed.map && !parsed.person) {
        excludedColumns.push('person');
    }

    return excludedColumns;
}

////////////////////////////////////////////////////////////
// Tower Statistics
////////////////////////////////////////////////////////////

// TODO: Extract parsing to 2mp_scraper

// Displays a 3x3 grid completion checkboxes/x'es for each upgrade+tier
// Displays base centered above grid
async function display2MPTowerStatistics(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    entryRow = await findTowerRow(tower);

    // Load the row where the map was found
    await sheet.loadCells(`${TOWER_COLS.TOWER}${entryRow}:${TOWER_COLS.LAST}${entryRow}`);

    // Check or X
    baseTowerCompletionMarking = await getCompletionMarking(entryRow, null, 2);

    const towerFormatted = Aliases.toIndexNormalForm(tower);

    let challengeEmbed = new Discord.EmbedBuilder()
        .setTitle(`2MPC Completions for ${towerFormatted}`)
        .setColor(paleblue)
        .addFields([
            { name: '\u200b', value: '\u200b', inline: true },
            { name: 'Base Tower', value: baseTowerCompletionMarking, inline: true },
            { name: '\u200b', value: '\u200b', inline: true }
        ]); // Left column placeholder
    // Base tower
    // Right column placeholder

    for (var tier = 3; tier <= 5; tier++) {
        for (var path = 1; path <= 3; path++) {
            towerUpgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(tower, path, tier);
            upgradeCompletionMarking = await getCompletionMarking(entryRow, path, tier);
            challengeEmbed.addFields([{ name: towerUpgradeName, value: upgradeCompletionMarking, inline: true }]);
        }
    }

    return challengeEmbed;
}

async function findTowerRow(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    // Load the column containing the different towers
    await sheet.loadCells(`${TOWER_COLS.TOWER}1:${TOWER_COLS.TOWER}${sheet.rowCount}`);

    entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= sheet.rowCount; row++) {
        let towerCandidate = sheet.getCellByA1(`${TOWER_COLS.TOWER}${row}`).value;

        if (!towerCandidate) continue;

        if (Towers.towerUpgradeToIndexNormalForm(tower) == towerCandidate) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw new UserCommandError(`Tower \`${Aliases.toIndexNormalForm(tower)}\` doesn't yet have a 2MP completion`);
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
        upgradeCol = String.fromCharCode(TOWER_COLS.BASE.charCodeAt(0) + (path - 1) * 3 + tier - 2);
    }

    completion = sheet.getCellByA1(`${upgradeCol}${entryRow}`).value.trim();

    if (completion == gHelper.HEAVY_CHECK_MARK) {
        return gHelper.WHITE_HEAVY_CHECK_MARK;
    } else {
        return gHelper.RED_X;
    }
}

////////////////////////////////////////////////////////////
// General Helpers
////////////////////////////////////////////////////////////

function err(e) {
    // TODO: The errors being caught here aren't UserCommandErrors, more like ComboErrors
    if (e instanceof UserCommandError || e instanceof DeveloperCommandError) {
        return new Discord.EmbedBuilder().setTitle(e.message).setColor(paleblue);
    } else {
        throw e;
    }
}

module.exports = {
    data: builder,
    execute
};
