// btw rml I kinda updated it to use the website but it is quite scuffed so sorry if i bastardized your code
import Aliases from '../aliases';

import gHelper from '../helpers/general.js';
import * as Index from '../helpers/index';
import * as Maps from '../helpers/maps';
import * as Towers from '../helpers/towers';
import Colors from '../helpers/colors';
import { SUPERGROUPS } from '../alias-repository';

import { discord } from '../aliases/misc.json';

import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandBooleanOption
} from 'discord.js';

import type { TowerEntityMatch } from '../helpers/towers';
import type { AliasMatch } from '../types/aliases';
import type { IndexPageResponse, TwoTCCompletion } from '../types/btd6index';
import type { ReadInputResult } from '../types/slash-commands';

const { palered } = Colors;

const entity1Option = new SlashCommandStringOption()
    .setName('entity1')
    .setDescription('Tower/Upgrade/Hero')
    .setRequired(false);

const entity2Option = new SlashCommandStringOption()
    .setName('entity2')
    .setDescription('Tower/Upgrade/Hero')
    .setRequired(false);

const mapOption = new SlashCommandStringOption().setName('map').setDescription('Map/Difficulty').setRequired(false);

const personOption = new SlashCommandStringOption().setName('person').setDescription('Completer').setRequired(false);

const ogOption = new SlashCommandBooleanOption().setName('og').setDescription('filter for only OG completions/only non-OG').setRequired(false);

const builder = new SlashCommandBuilder()
    .setName('2tc')
    .setDescription('Search and Browse Completed 2TC Index Combos')
    .addStringOption(entity1Option)
    .addStringOption(entity2Option)
    .addStringOption(mapOption)
    .addStringOption(personOption)
    .addBooleanOption(ogOption);

interface TwoTCInput {
    /** entity1 and entity2, null where not given */
    entities: (TowerEntityMatch | null)[];
    map: AliasMatch<'map' | 'map_difficulty'> | null;
    person: string | null;
    og: boolean | null;
}

function readInput(interaction: ChatInputCommandInteraction): ReadInputResult<TwoTCInput> {
    const entities: (TowerEntityMatch | null)[] = [];
    for (const num of [1, 2]) {
        const entityArg = interaction.options.getString(`entity${num}`);
        let entity: TowerEntityMatch | null = null;
        if (entityArg) {
            entity = Towers.lookupTowerEntity(entityArg);
            if (!entity) return { error: `Entity${num} did not match a tower/upgrade/hero` };
            entity = Towers.baseTowerIfLowTier(entity);
        }
        entities.push(entity);
    }

    const mapArg = interaction.options.getString('map');
    let map: AliasMatch<'map' | 'map_difficulty'> | null = null;
    if (mapArg) {
        map = Aliases.lookupMultiple(mapArg, SUPERGROUPS.MAP);
        if (!map) return { error: `Map/Difficulty not valid` };
    }

    const person = interaction.options.getString('person')?.toLowerCase() || null;
    const og = interaction.options.getBoolean('og');

    return { input: { entities, map, person, og } };
}

async function fetch2tc(searchParams: URLSearchParams) {
    return await Index.fetchIndex('2tc', searchParams);
}

async function execute(interaction: ChatInputCommandInteraction) {
    const { error, input } = readInput(interaction);
    if (error) {
        return await interaction.reply({
            content: error,
            flags: MessageFlags.Ephemeral
        });
    }
    await interaction.deferReply();

    const towers = providedEntityNames(input);
    const map = input.map?.kind === 'map' ? Aliases.toIndexNormalForm(input.map.canonical) : null;

    // og=1 keeps only OG completions; og=false is still sent since we don't want to exclude OGs even when false
    const og = input.og ? '1' : input.og === false ? 'false' : null;

    // construct the search parameters to btd6 index API
    const searchParams = new URLSearchParams(
        Object.entries({
            towerquery: JSON.stringify(towers),
            map,
            person: input.person,
            difficulty: input.map?.kind === 'map_difficulty' ? input.map.canonical : null,
            count: '100',
            og: og
        }).filter(([, value]) => value !== null && value !== undefined)
    );

    let resJson = await fetch2tc(searchParams);

    await displayCombos(interaction, resJson, input, searchParams);
}

async function displayCombos(
    interaction: ChatInputCommandInteraction,
    resJson: IndexPageResponse<TwoTCCompletion>,
    input: TwoTCInput,
    searchParams: URLSearchParams
) {
    const combos = resJson.results;

    if (combos.length == 0) {
        return await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(embedTitleNoCombos(input))
                    .setColor(palered)
            ]
        });
    }

    // Only one combo found
    if (combos.length == 1) {

        let challengeEmbed = new EmbedBuilder()
            .setTitle(embedTitle(input, combos))
            .setColor(palered);

        const combo = combos[0];

        // i give up I'm hardcoding the fields to use for displaying a single combo ~hemi
        let fields: ('tower1' | 'tower2' | 'map' | 'person' | 'version' | 'date')[] = ['tower1', 'tower2', 'map', 'person'];
        // only OG combos have version and date infomation
        if (combo.og) fields.push('version', 'date');

        const fieldValue = (field: (typeof fields)[number]) => (field === 'version' || field === 'date' ? Index.orUnknown(combo[field]) : combo[field]);
        fields.forEach((field) => challengeEmbed.addFields([{ name: gHelper.toTitleCase(field), value: fieldValue(field), inline: true }]));

        challengeEmbed.addFields([{ name: 'Link', value: Index.genCompletionLink(combo), inline: true }]);
        challengeEmbed.addFields([{ name: 'OG?', value: combo.og ? 'OG' : 'ALT', inline: true }]);

        if (combo.pending) challengeEmbed.setFooter({ text: "This completion is pending verification" });

        // add support server link
        challengeEmbed.addFields([{ name: 'Found something wrong?', value: `please report them [here](${discord})` }]);

        return await interaction.editReply({ embeds: [challengeEmbed] });

    } else {
        // Multiple combos found
        let OGSearchParams = new URLSearchParams(searchParams);
        OGSearchParams.set('og', '1');
        let resJson = await fetch2tc(OGSearchParams);
        let numOGCompletions = resJson.count;

        function setOtherDisplayFields(challengeEmbed: EmbedBuilder) {
            challengeEmbed
                .setTitle(embedTitle(input, combos))
                .setColor(palered);

            let footerText = "---\n";
            if (!input.og) { // i.e. not exclusively OG completions

                if (numOGCompletions == 1)
                    footerText += `OG completion bolded\n`;
                if (numOGCompletions > 1)
                    footerText += `${numOGCompletions} OG completions bolded\n`;
            }
            footerText += "Pending completions italicized";
            challengeEmbed.setFooter({ text: footerText });
        }

        const displayFields = getDisplayCols(input);
        searchParams.set('count', '10');

        // "Magic function" for pagination
        return await Index.displayIndexPages(interaction, fetch2tc, searchParams, displayFields,
            completion => {

                const boldOg = (str: string) => completion.og ? `**${str}**` : str;
                const italicizePending = (str: string) => completion.pending ? `_${str}_` : str;
                const addTextDecoration = (str: string) => italicizePending(boldOg(str));

                let obj: Record<string, string> = {};

                // console.log(completion);

                let specifiedTower = providedDefinedEntityNames(input)[0];

                displayFields.forEach((field) => {
                    if (field == 'Link') obj.Link = addTextDecoration(Index.genCompletionLink(completion));
                    if (field == 'version') return obj.version = addTextDecoration(Index.orUnknown(completion.version));
                    // The remaining columns other than unspecified_tower are completion fields named the same
                    if (completion[field]) return obj[field] = addTextDecoration(String(completion[field]));
                    if (field == 'unspecified_tower') {
                        if (completion.tower1 == specifiedTower) obj.unspecified_tower = addTextDecoration(completion.tower2);
                        else if (completion.tower2 == specifiedTower) obj.unspecified_tower = addTextDecoration(completion.tower1);
                    }
                });
                return obj;
            }, setOtherDisplayFields);
    }
}

function getDisplayCols(input: TwoTCInput): string[] {
    const definiteTowers = providedDefinedEntityNames(input);
    if (input.person) {
        if (definiteTowers.length == 2) {
            return ['version', 'map', 'Link'];
        } else if (definiteTowers.length == 1) {
            return ['unspecified_tower', 'map', 'Link'];
        } else if (input.map?.kind === 'map') {
            return ['tower1', 'tower2', 'Link'];
        } else {
            return ['tower1', 'tower2', 'map'];
        }
    } else if (input.map?.kind === 'map_difficulty') {
        if (definiteTowers.length == 2) {
            return ['person', 'map', 'Link'];
        }
        if (definiteTowers.length == 1) {
            return ['unspecified_tower', 'map', 'Link'];
        } else {
            // return ['NUMBER', 'map', 'Link']; Since we cant search for number anymore no point including number
            return ['tower1', 'tower2', 'map'];
        }
    } else if (definiteTowers.length == 2) {
        return ['map', 'person', 'Link'];
    } else if (definiteTowers.length == 1) {
        return ['unspecified_tower', 'person', 'Link'];
    } else {
        return ['tower1', 'tower2', 'Link'];
    }
}

// include sampleCombo for the correct capitalization and punctuation
function embedTitle(input: TwoTCInput, combos: TwoTCCompletion[]): string {
    const multipleCombos = combos.length > 1;

    const towers = providedEntityNames(input);

    let title = multipleCombos ? 'All 2TC Combos ' : 'Only 2TC Combo ';
    if (input.person) title += `by ${input.person} `;
    if (input.map?.kind === 'map') title += `on ${Maps.indexMapAbbreviationToNormalForm(input.map.canonical)} `;
    if (input.map?.kind === 'map_difficulty') title += `on ${Aliases.toIndexNormalForm(input.map.canonical)} Maps `;
    for (let i = 0; i < towers.length; i++) {
        const tower = towers[i];
        if (i == 0) title += 'with ';
        else title += 'and ';
        title += `${tower} `;
    }
    return title.slice(0, title.length - 1);
}

function embedTitleNoCombos(input: TwoTCInput): string {
    const towers = providedEntityNames(input);

    let title = 'No Combos found ';
    if (input.person) title += `by "${input.person}" `;
    if (input.map?.kind === 'map') title += `on ${Aliases.toIndexNormalForm(input.map.canonical)} `;
    if (input.map?.kind === 'map_difficulty') title += `on ${Aliases.toIndexNormalForm(input.map.canonical)} Maps `;
    for (let i = 0; i < towers.length; i++) {
        const tower = towers[i];
        if (i == 0) title += 'with ';
        else title += 'and ';
        title += `${tower} `;
    }
    return title.slice(0, title.length - 1);
}

// Index names of entity1 and entity2, skipping missing ones
function providedEntityNames(input: TwoTCInput): string[] {
    return input.entities.map((entity) => Towers.towerEntityIndexName(entity)).filter((el) => el);
}

// Index names of the entities that pin down one tower in a combo: tower upgrades first, then heroes
function providedDefinedEntityNames(input: TwoTCInput): string[] {
    const namesOfKind = (kind: TowerEntityMatch['kind']) =>
        input.entities.filter((entity) => entity?.kind === kind).map((entity) => Towers.towerEntityIndexName(entity));
    return [...namesOfKind('tower_upgrade'), ...namesOfKind('hero')];
}

export { builder as data, execute };
