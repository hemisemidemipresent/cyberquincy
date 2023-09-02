const { WHITE_HEAVY_CHECK_MARK, RED_X, partition } = require('../helpers/general.js');
const Index = require('../helpers/index.js');
const Maps = require('../helpers/maps');

const { paleblue } = require('../jsons/colors.json');

const Parsed = require('../parser/parsed.js');

const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

let entityOption = new SlashCommandStringOption().setName('entity').setDescription('Hero/Tower/Upgrade').setRequired(false);

let mapOption = new SlashCommandStringOption().setName('map').setDescription('Map/Difficulty').setRequired(false);

let userOption = new SlashCommandStringOption().setName('person').setDescription('Person').setRequired(false);

builder = new SlashCommandBuilder()
    .setName('2mp')
    .setDescription('Search and Browse Completed 2MP Index Combos')
    .addStringOption(entityOption)
    .addStringOption(mapOption)
    .addStringOption(userOption);

async function fetch2mp(searchParams) {
    let res = await fetch('https://btd6index.win/fetch-2mp?' + searchParams);
    let resJson = await res.json();
    if ('error' in resJson) {
        throw new Error(resJson.error);
    }
    return resJson;
}

function genCompletionLink(completion) {
    return `[Link](${completion.link ?? `https://media.btd6index.win/${completion.filekey}`})`;
}

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

    await interaction.deferReply();
    
    const entityType = parsed.tower ? Aliases.toIndexNormalForm(parsed.tower) : null;
    const entity = parsed.tower_upgrade ? Towers.towerUpgradeToIndexNormalForm(parsed.tower_upgrade) : null;
    const hero = parsed.hero ? Aliases.toIndexNormalForm(parsed.hero) : null;
    const map = parsed.map ? Aliases.toIndexNormalForm(parsed.map) : null;

    const fetchParams = new URLSearchParams(
        Object.entries({
            towerquery: JSON.stringify([entityType ?? entity ?? hero].filter(val => val)),
            map,
            person: parsed.person,
            difficulty: parsed.map_difficulty,
            pending: '0',
            count: '100'
        }).filter(([,value]) => value !== null && value !== undefined)
    );
    
    if (parsed.tower && !parsed.map && !parsed.map_difficulty && !parsed.person) {
        fetchParams.set('og', '1');
        const resJson = await fetch2mp(fetchParams);
        return await interaction.editReply({
            embeds: [embed2MPTowerStatistics(resJson, parsed.tower)]
        });
    } else if ((parsed.tower_upgrade || parsed.hero) && !parsed.person) {
        const resJson = await fetch2mp(fetchParams);
        let challengeEmbed;

        try {
            if (parsed.map_difficulty) {
                challengeEmbed = embed2MPMapDifficulty(resJson, entity ?? hero, parsed.map_difficulty);
            } else if (parsed.map) {
                challengeEmbed = await embed2MPAlt(resJson, entity ?? hero, parsed.map);
            } else {
                challengeEmbed = await embed2MPOG(entity ?? hero);
            }
        } catch (e) {
            challengeEmbed = err(e);
        }

        return await interaction.editReply({
            embeds: [challengeEmbed]
        });
    }
    try {
        return await display2MPFilterAll(interaction, fetchParams, parsed);
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

async function embed2MPOG(entity) {
    let resJson = await fetch2mp(new URLSearchParams({
        towerquery: JSON.stringify([entity]),
        pending: '0',
        count: '100'
    }));

    if (resJson.results.length === 0) {
        throw new UserCommandError(`Entity \`${entity}\` does not yet have a 2MP`);
    }

    let ogCompletion = resJson.results.find(completion => completion.og);

    const comboToEmbed = await orderAndFlatten2MPOGCompletion(ogCompletion);

    // Embed and send the message
    let challengeEmbed = new Discord.EmbedBuilder().setTitle(`${entity} 2MPC Combo`).setColor(paleblue);

    challengeEmbed.addFields(
        Object.entries(comboToEmbed).map(([field, value]) => ({name: field, value, inline: true}))
    );
    challengeEmbed.addFields([{ name: 'OG?', value: 'OG', inline: true }]);

    const ogMapAbbr = Maps.indexNormalFormToMapAbbreviation(ogCompletion.map);
    let completedAltMapsFields = Index.altMapsFields(
        ogMapAbbr,
        resJson.results.map(completion => Maps.indexNormalFormToMapAbbreviation(completion.map)),
        Maps.mapsNotPossible(entity)
    );

    challengeEmbed.addFields([{ name: '**Alt Maps**', value: completedAltMapsFields.field }]);

    if (completedAltMapsFields.footer) {
        challengeEmbed.setFooter({ text: completedAltMapsFields.footer });
    }

    return challengeEmbed;
}

async function orderAndFlatten2MPOGCompletion(ogCompletion) {
    let ogInfo = await fetch('https://btd6index.win/fetch-2mp-og-info?' + new URLSearchParams({entity: ogCompletion.entity}));
    ogInfo = await ogInfo.json();

    if ('error' in ogInfo) {
        throw new Error(ogInfo.error);
    }

    return {
        Entity: ogCompletion.entity,
        Upgrade: ogInfo.result.upgrade,
        'OG Map': ogCompletion.map,
        Version: ogInfo.result.version,
        Date: ogInfo.result.date,
        Person: ogCompletion.person,
        Link: genCompletionLink(ogCompletion)
    };
}

////////////////////////////////////////////////////////////
// 2MP Alt Map
////////////////////////////////////////////////////////////

async function embed2MPAlt(resJson, entity, map) {
    const mapFormatted = Aliases.toIndexNormalForm(map);

    const altCombo = resJson.results[0];

    if (!altCombo) {
        throw new UserCommandError(`\`${entity}\` hasn't been completed yet on \`${mapFormatted}\``);
    }

    // Display OG map as if map weren't in the query
    if (altCombo.og) {
        return embed2MPOG(entity);
    }

    // Embed and send the message
    let challengeEmbed = new Discord.EmbedBuilder()
        .setTitle(`${entity} 2MPC Combo on ${mapFormatted}`)
        .setColor(paleblue)
        .addFields([
            { name: 'Person', value: altCombo.person, inline: true },
            { name: 'Link', value: genCompletionLink(altCombo), inline: true }
        ]);

    return challengeEmbed;
}

////////////////////////////////////////////////////////////
// 2MP Map Difficulty
////////////////////////////////////////////////////////////

// Displays all 2MPCs completed on all maps specified by the map difficulty
function embed2MPMapDifficulty(resJson, entity, mapDifficulty) {
    const mapDifficultyFormatted = Aliases.toIndexNormalForm(mapDifficulty);

    if (resJson.results.length === 0) {
        throw new UserCommandError(`\`${entity}\` hasn't been completed yet on any \`${mapDifficulty}\` maps`);
    }

    // Get all map abbreviations for the specified map difficulty
    const permittedMapAbbrs = Maps.allMapsFromMapDifficulty(mapDifficulty).map((map) => Maps.mapToIndexAbbreviation(map));
    const completedMaps = resJson.results.map(completion => Maps.mapToIndexAbbreviation(Aliases.getCanonicalForm(completion.map)));

    // Format 3 columns: map, person, link
    let mapColumn = [];
    let personColumn = [];
    let linkColumn = [];
    for (const completion of resJson.results) {
        const bold = completion.og ? '**' : '';

        mapColumn.push(`${bold}${completion.map}${bold}`);
        personColumn.push(`${bold}${completion.person}${bold}`);
        linkColumn.push(`${bold}${genCompletionLink(completion)}${bold}`);
    }

    const numPartitions = mapColumn.length > 10 ? 2 : 1
    let [mapColumn1, mapColumn2] = partition(mapColumn, numPartitions)
    let [personColumn1, personColumn2] = partition(personColumn, numPartitions)
    let [linkColumn1, linkColumn2] = partition(linkColumn, numPartitions)

    mapColumn1 = mapColumn1.join('\n');
    personColumn1 = personColumn1.join('\n');
    linkColumn1 = linkColumn1.join('\n');

    mapColumn2 = mapColumn2?.join('\n');
    personColumn2 = personColumn2?.join('\n');
    linkColumn2 = linkColumn2?.join('\n');

    let mapsLeft = permittedMapAbbrs.filter((m) => !completedMaps.includes(m));

    // Check if tower is water tower
    const impossibleMaps = Maps.mapsNotPossible(entity).filter(m => permittedMapAbbrs.includes(m))
    mapsLeft = mapsLeft.filter((m) => !impossibleMaps.includes(m));

    // Embed and send the message
    let challengeEmbed = new Discord.EmbedBuilder()
        .setTitle(`${entity} 2MPCs on ${mapDifficultyFormatted} Maps`)
        .setColor(paleblue);

    const numCombosPossible = permittedMapAbbrs.length - impossibleMaps.length;
    let possiblePhrasing;
    if (mapsLeft.length > 0) {
        possiblePhrasing = impossibleMaps.length > 0 ? ' (where placement is possible)' : '';
        challengeEmbed.addFields([
            { name: `Combos${possiblePhrasing}`, value: `**${completedMaps.length}**/${numCombosPossible}` }
        ]);
    } else {
        possiblePhrasing = impossibleMaps.length > 0 ? ' possible' : '';
        challengeEmbed.addFields([
            { name: `All${possiblePhrasing} ${mapDifficulty} maps completed`, value: '-'.repeat(40) }
        ]);
    }

    challengeEmbed.addFields([
        { name: 'Map', value: mapColumn1, inline: true },
        { name: 'Person', value: personColumn1, inline: true },
        { name: 'Link', value: linkColumn1, inline: true },
    ]);

    if (mapColumn2) {
        challengeEmbed.addFields([
            { name: 'Map', value: mapColumn2, inline: true },
            { name: 'Person', value: personColumn2, inline: true },
            { name: 'Link', value: linkColumn2, inline: true },
        ])
    }

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

async function display2MPFilterAll(interaction, fetchParams, parsed) {
    const excludedColumns = determineExcludedColumns(parsed);
    fetchParams.set('count', '0');
    if ((await fetch2mp(fetchParams)).count <= 0) {
        throw new UserCommandError(titleFunction(parsed, true));
    }
    fetchParams.set('count', '10');
    return await Index.displayOneOrMultiplePagesNew(
        interaction, fetch2mp, fetchParams,
        ['Tower', 'Map', 'Person', 'Link'].filter(col => !excludedColumns.includes(col)),
        completion => {
            const boldOg = (str) => completion.og ? `**${str}**` : str;

            return {
                'Tower': boldOg(completion.entity),
                'Map': boldOg(completion.map),
                'Person': boldOg(completion.person),
                'Link': boldOg(genCompletionLink(completion))
            };
        },
        embed => {
            embed
            .setTitle(titleFunction(parsed))
            .setColor(paleblue)
            .setFooter({ text: `---\nAny OG completion(s) bolded` });
        }
    );
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
        excludedColumns.push('Tower');
    }

    if (parsed.map) {
        excludedColumns.push('Map');
    }

    if (parsed.person || !parsed.hasAny()) {
        excludedColumns.push('Person');
    }

    if (!parsed.tower_upgrade && !parsed.hero && !parsed.map && !parsed.person) {
        excludedColumns.push('Person');
    }

    return excludedColumns;
}

////////////////////////////////////////////////////////////
// Tower Statistics
////////////////////////////////////////////////////////////

// Displays a 3x3 grid completion checkboxes/x'es for each upgrade+tier
// Displays base centered above grid
function embed2MPTowerStatistics(resJson, tower) {
    const towerFormatted = Aliases.toIndexNormalForm(tower);

    const completedComboEntities = resJson.results.map(res => res.entity);

    const baseTowerUpgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(tower)
    const baseTowerCompletionMarking = completedComboEntities.includes(baseTowerUpgradeName) ? WHITE_HEAVY_CHECK_MARK : RED_X

    let challengeEmbed = new Discord.EmbedBuilder()
        .setTitle(`2MPC Completions for ${towerFormatted}`)
        .setColor(paleblue)
        .addFields([
            { name: '\u200b', value: '\u200b', inline: true }, // Left column placeholder
            { name: 'Base Tower', value: baseTowerCompletionMarking, inline: true }, // Tower
            { name: '\u200b', value: '\u200b', inline: true } // Right column placeholder
        ]);

    let tier;
    for (tier = 3; tier <= 5; tier++) {
        Towers.allPaths().forEach(path => {
            let towerUpgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(tower, path, tier);
            let upgradeCompletionMarking = completedComboEntities.includes(towerUpgradeName) ? WHITE_HEAVY_CHECK_MARK : RED_X
            challengeEmbed.addFields([{ name: towerUpgradeName, value: upgradeCompletionMarking, inline: true }]);
        })
    }

    return challengeEmbed;
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
