import gHelper from '../helpers/general.js';
import Aliases from '../aliases';
import { displayIndexPages, altMapsFields, genCompletionLink, fetchIndex, orUnknown } from '../helpers/index';
import * as Maps from '../helpers/maps';
import * as Towers from '../helpers/towers';
import Colors from '../helpers/colors';
import { SUPERGROUPS, type AliasMatch } from '../alias-repository';

import { discord } from '../aliases/misc.json';

import UserCommandError from '../exceptions/user-command-error.js';
import DeveloperCommandError from '../exceptions/developer-command-error.js';

import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';

import type { TowerEntityMatch } from '../helpers/towers';
import type { MapCanonical, MapDifficultyCanonical } from '../types/aliases';
import type { TowerTypeCanonical } from '../types/towers';
import type { IndexPageResponse, TwoMPCompletion } from '../types/btd6index';
import type { ReadInputResult } from '../types/slash-commands';

const { WHITE_HEAVY_CHECK_MARK, RED_X, partition } = gHelper;
const { paleblue } = Colors;

let entityOption = new SlashCommandStringOption().setName('entity').setDescription('Hero/Tower/Upgrade').setRequired(false);

let mapOption = new SlashCommandStringOption().setName('map').setDescription('Map/Difficulty').setRequired(false);

let userOption = new SlashCommandStringOption().setName('person').setDescription('Person').setRequired(false);

const builder = new SlashCommandBuilder()
    .setName('2mp')
    .setDescription('Search and Browse Completed 2MP Index Combos')
    .addStringOption(entityOption)
    .addStringOption(mapOption)
    .addStringOption(userOption);

interface TwoMPInput {
    entity: TowerEntityMatch | null;
    map: AliasMatch<'map' | 'map_difficulty'> | null;
    person: string | null;
}

async function fetch2mp(searchParams: URLSearchParams) {
    return await fetchIndex('2mp', searchParams);
}

async function execute(interaction: ChatInputCommandInteraction) {
    const { error, input } = readInput(interaction);
    if (error)
        return await interaction.reply({
            content: error,
            flags: MessageFlags.Ephemeral
        });

    await interaction.deferReply();

    const { entity, map, person } = input;
    const entityName = Towers.towerEntityIndexName(entity);

    const fetchParams = new URLSearchParams(
        Object.entries({
            towerquery: JSON.stringify([entityName].filter(val => val)),
            map: map?.kind === 'map' ? Aliases.toIndexNormalForm(map.canonical) : null,
            person,
            difficulty: map?.kind === 'map_difficulty' ? map.canonical : null,
            count: '100'
        }).filter(([,value]) => value !== null && value !== undefined)
    );

    if (entity?.kind === 'tower' && !map && !person) {
        fetchParams.set('og', '1');
        const resJson = await fetch2mp(fetchParams);
        return await interaction.editReply({
            embeds: [embed2MPTowerStatistics(resJson, entity.canonical)]
        });
    } else if ((entity?.kind === 'tower_upgrade' || entity?.kind === 'hero') && !person) {
        const resJson = await fetch2mp(fetchParams);
        let challengeEmbed: EmbedBuilder;

        try {
            if (map?.kind === 'map_difficulty') {
                challengeEmbed = embed2MPMapDifficulty(resJson, entity, map.canonical);
            } else if (map?.kind === 'map') {
                challengeEmbed = await embed2MPAlt(resJson, entity, map.canonical);
            } else {
                challengeEmbed = await embed2MPOG(entity);
            }
        } catch (e) {
            challengeEmbed = err(e);
        }

        // add support server link
        challengeEmbed.addFields([{ name: 'Found something wrong?', value: `please report them [here](${discord})` }]);

        return await interaction.editReply({
            embeds: [challengeEmbed]
        });
    }
    try {
        return await display2MPFilterAll(interaction, fetchParams, input);
    } catch (e) {
        return await interaction.editReply({ embeds: [err(e)] });
    }
}

////////////////////////////////////////////////////////////
// Reading SlashCommand Input
////////////////////////////////////////////////////////////

function readInput(interaction: ChatInputCommandInteraction): ReadInputResult<TwoMPInput> {
    const entityArg = interaction.options.getString('entity');
    const mapArg = interaction.options.getString('map');
    const person = interaction.options.getString('person')?.toLowerCase() || null;

    let entity: TowerEntityMatch | null = null;
    if (entityArg) {
        entity = Towers.lookupTowerEntity(entityArg);
        if (!entity) return { error: `Entity didn't match tower/upgrade/hero, including aliases` };
        entity = Towers.baseTowerIfLowTier(entity);
    }

    let map: AliasMatch<'map' | 'map_difficulty'> | null = null;
    if (mapArg) {
        map = Aliases.lookupMultiple(mapArg, SUPERGROUPS.MAP);
        if (!map) return { error: `Map/Difficulty didn't match, including aliases` };
    }

    if ((entity?.kind === 'tower_upgrade' || entity?.kind === 'hero') && map?.kind === 'map' && person) {
        return { error: "Don't search a person if you're already narrowing down your search to a specific completion" };
    }

    return { input: { entity, map, person } };
}

////////////////////////////////////////////////////////////
// 2MP OG
////////////////////////////////////////////////////////////

// `entity` is a tower upgrade or hero
async function embed2MPOG(entity: TowerEntityMatch): Promise<EmbedBuilder> {
    const entityName = Towers.towerEntityIndexName(entity);
    let resJson = await fetch2mp(new URLSearchParams({
        towerquery: JSON.stringify([entityName]),
        count: '100'
    }));

    if (resJson.results.length === 0) {
        throw new UserCommandError(`Entity \`${entityName}\` does not yet have a 2MP`);
    }

    let ogCompletion = resJson.results.find(completion => completion.og);

    const comboToEmbed = await orderAndFlatten2MPOGCompletion(ogCompletion);

    // Embed and send the message
    let challengeEmbed = new EmbedBuilder().setTitle(`${entityName} 2MPC Combo`).setColor(paleblue);

    challengeEmbed.addFields(
        Object.entries(comboToEmbed).map(([field, value]) => ({ name: field, value, inline: true }))
    );
    challengeEmbed.addFields([{ name: 'OG?', value: 'OG', inline: true }]);

    const ogMapAbbr = Maps.indexNormalFormToMapAbbreviation(ogCompletion.map);
    let completedAltMapsFields = altMapsFields(
        ogMapAbbr,
        resJson.results.map(completion => Maps.indexNormalFormToMapAbbreviation(completion.map)),
        Maps.mapsNotPossible(entity.canonical)
    );

    challengeEmbed.addFields([{ name: '**Alt Maps**', value: completedAltMapsFields.field }]);

    if (completedAltMapsFields.footer) {
        challengeEmbed.setFooter({ text: completedAltMapsFields.footer });
    }

    return challengeEmbed;
}

async function orderAndFlatten2MPOGCompletion(ogCompletion: TwoMPCompletion): Promise<Record<string, string>> {
    const ogInfo = await fetchIndex('2mp-og-info', new URLSearchParams({ entity: ogCompletion.entity }));

    return {
        Entity: ogCompletion.entity,
        Upgrade: ogInfo.result.upgrade,
        'OG Map': ogCompletion.map,
        Version: orUnknown(ogInfo.result.version),
        Date: orUnknown(ogInfo.result.date),
        Person: ogCompletion.person,
        Link: genCompletionLink(ogCompletion)
    };
}

////////////////////////////////////////////////////////////
// 2MP Alt Map
////////////////////////////////////////////////////////////

async function embed2MPAlt(resJson: IndexPageResponse<TwoMPCompletion>, entity: TowerEntityMatch, map: MapCanonical): Promise<EmbedBuilder> {
    const entityName = Towers.towerEntityIndexName(entity);
    const mapFormatted = Aliases.toIndexNormalForm(map);

    const altCombo = resJson.results[0];

    if (!altCombo) {
        throw new UserCommandError(`\`${entityName}\` hasn't been completed yet on \`${mapFormatted}\``);
    }

    // Display OG map as if map weren't in the query
    if (altCombo.og) {
        return embed2MPOG(entity);
    }

    console.log(resJson);

    // Embed and send the message
    let challengeEmbed = new EmbedBuilder()
        .setTitle(`${entityName} 2MPC Combo on ${mapFormatted}`)
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
function embed2MPMapDifficulty(
    resJson: IndexPageResponse<TwoMPCompletion>,
    entity: TowerEntityMatch,
    mapDifficulty: MapDifficultyCanonical
): EmbedBuilder {
    const entityName = Towers.towerEntityIndexName(entity);
    const mapDifficultyFormatted = Aliases.toIndexNormalForm(mapDifficulty);

    if (resJson.results.length === 0) {
        throw new UserCommandError(`\`${entityName}\` hasn't been completed yet on any \`${mapDifficulty}\` maps`);
    }

    // Get all map abbreviations for the specified map difficulty
    const permittedMapAbbrs = Maps.allMapsFromMapDifficulty(mapDifficulty).map((map) => Maps.mapToIndexAbbreviation(map));
    const completedMaps = resJson.results.map(completion => Maps.indexNormalFormToMapAbbreviation(completion.map));

    // Format 3 columns: map, person, link
    let mapColumn: string[] = [];
    let personColumn: string[] = [];
    let linkColumn: string[] = [];
    for (const completion of resJson.results) {
        const bold = completion.og ? '**' : '';

        mapColumn.push(`${bold}${completion.map}${bold}`);
        personColumn.push(`${bold}${completion.person}${bold}`);
        linkColumn.push(`${bold}${genCompletionLink(completion)}${bold}`);
    }

    // Split into two sets of columns when there are too many rows for one
    const numPartitions = mapColumn.length > 10 ? 2 : 1;
    const joinPartitions = (column: string[]): string[] => partition(column, numPartitions).map((part: string[]) => part.join('\n'));
    const [mapColumn1, mapColumn2] = joinPartitions(mapColumn);
    const [personColumn1, personColumn2] = joinPartitions(personColumn);
    const [linkColumn1, linkColumn2] = joinPartitions(linkColumn);

    let mapsLeft = permittedMapAbbrs.filter((m) => !completedMaps.includes(m));

    // Check if tower is water tower
    const impossibleMaps = Maps.mapsNotPossible(entity.canonical).filter(m => permittedMapAbbrs.includes(m));
    mapsLeft = mapsLeft.filter((m) => !impossibleMaps.includes(m));

    // Embed and send the message
    let challengeEmbed = new EmbedBuilder()
        .setTitle(`${entityName} 2MPCs on ${mapDifficultyFormatted} Maps`)
        .setColor(paleblue);

    const numCombosPossible = permittedMapAbbrs.length - impossibleMaps.length;
    let possiblePhrasing: string;
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
        ]);
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

async function display2MPFilterAll(interaction: ChatInputCommandInteraction, fetchParams: URLSearchParams, input: TwoMPInput) {
    const excludedColumns = determineExcludedColumns(input);
    fetchParams.set('count', '0');
    if ((await fetch2mp(fetchParams)).count <= 0) {
        throw new UserCommandError(titleFunction(input, true));
    }
    fetchParams.set('count', '10');
    return await displayIndexPages(
        interaction, fetch2mp, fetchParams,
        ['Tower', 'Map', 'Person', 'Link'].filter(col => !excludedColumns.includes(col)),
        completion => {
            const boldOg = (str: string) => completion.og ? `**${str}**` : str;
            const italicizePending = (str: string) => completion.pending ? `_${str}_` : str;
            const addTextDecoration = (str: string) => italicizePending(boldOg(str));

            return {
                'Tower': addTextDecoration(completion.entity),
                'Map': addTextDecoration(completion.map),
                'Person': addTextDecoration(completion.person),
                'Link': addTextDecoration(genCompletionLink(completion))
            };
        },
        embed => {
            embed
                .setTitle(titleFunction(input))
                .setColor(paleblue)
                .setFooter({ text: `---\nAny OG completion(s) bolded` });
        }
    );
}

function titleFunction(input: TwoMPInput, noCombos = false): string {
    let title: string;
    if (noCombos) {
        title = 'No 2MPs Completed';
    } else {
        title = 'All 2MPs';
    }

    const entityName = Towers.towerEntityIndexName(input.entity);
    if (entityName) {
        title += ` with ${entityName}`;
    }

    if (input.map?.kind === 'map') {
        title += ` on ${Aliases.toIndexNormalForm(input.map.canonical)}`;
    } else if (input.map?.kind === 'map_difficulty') {
        title += ` on ${Aliases.toIndexNormalForm(input.map.canonical)} maps`;
    }

    if (input.person) {
        title += ` by ${input.person}`;
    }

    return title;
}

function determineExcludedColumns({ entity, map, person }: TwoMPInput): string[] {
    let excludedColumns: string[] = [];
    const isCompletionEntity = entity?.kind === 'tower_upgrade' || entity?.kind === 'hero';

    if (isCompletionEntity) {
        excludedColumns.push('Tower');
    }

    if (map?.kind === 'map') {
        excludedColumns.push('Map');
    }

    if (person || (!entity && !map)) {
        excludedColumns.push('Person');
    }

    if (!isCompletionEntity && map?.kind !== 'map' && !person) {
        excludedColumns.push('Person');
    }

    return excludedColumns;
}

////////////////////////////////////////////////////////////
// Tower Statistics
////////////////////////////////////////////////////////////

// Displays a 3x3 grid completion checkboxes/x'es for each upgrade+tier
// Displays base centered above grid
function embed2MPTowerStatistics(resJson: IndexPageResponse<TwoMPCompletion>, tower: TowerTypeCanonical): EmbedBuilder {
    const towerFormatted = Aliases.toIndexNormalForm(tower);

    const completedComboEntities: string[] = resJson.results.map(res => res.entity);

    const baseTowerUpgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(tower);
    const baseTowerCompletionMarking = completedComboEntities.includes(baseTowerUpgradeName) ? WHITE_HEAVY_CHECK_MARK : RED_X;

    let challengeEmbed = new EmbedBuilder()
        .setTitle(`2MPC Completions for ${towerFormatted}`)
        .setColor(paleblue)
        .addFields([
            { name: '​', value: '​', inline: true }, // Left column placeholder
            { name: 'Base Tower', value: baseTowerCompletionMarking, inline: true }, // Tower
            { name: '​', value: '​', inline: true } // Right column placeholder
        ]);

    for (let tier = 3; tier <= 5; tier++) {
        Towers.allPaths().forEach(path => {
            let towerUpgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(tower, path, tier);
            let upgradeCompletionMarking = completedComboEntities.includes(towerUpgradeName) ? WHITE_HEAVY_CHECK_MARK : RED_X;
            challengeEmbed.addFields([{ name: towerUpgradeName, value: upgradeCompletionMarking, inline: true }]);
        });
    }

    return challengeEmbed;
}

////////////////////////////////////////////////////////////
// General Helpers
////////////////////////////////////////////////////////////

// Turns an expected "no results" error into an embed; anything else is rethrown
function err(e: unknown): EmbedBuilder {
    // TODO: The errors being caught here aren't UserCommandErrors, more like ComboErrors
    if (e instanceof UserCommandError || e instanceof DeveloperCommandError) {
        return new EmbedBuilder().setTitle(e.message).setColor(paleblue);
    } else {
        throw e;
    }
}

export { builder as data, execute };
