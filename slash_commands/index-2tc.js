// btw rml I kinda updated it to use the website but it is quite scuffed so sorry if i bastardized your code
const Aliases = require('../aliases');

const gHelper = require('../helpers/general.js');
const Index = require('../helpers/index.js');
const Maps = require('../helpers/maps');
const Towers = require('../helpers/towers');
const { SUPERGROUPS } = require('../alias-repository');

const { palered } = require('../jsons/colors.json');
const { discord } = require('../aliases/misc.json');

BANNED_HEROES = ['sauda', 'geraldo', 'corvus'];

const { MessageFlags, SlashCommandBuilder, SlashCommandStringOption, SlashCommandBooleanOption } = require('discord.js');

const entity1Option = new SlashCommandStringOption()
    .setName('entity1')
    .setDescription('Tower/Path/Upgrade/Hero')
    .setRequired(false);

const entity2Option = new SlashCommandStringOption()
    .setName('entity2')
    .setDescription('Tower/Path/Upgrade/Hero')
    .setRequired(false);

const mapOption = new SlashCommandStringOption().setName('map').setDescription('Map/Difficulty').setRequired(false);

const personOption = new SlashCommandStringOption().setName('person').setDescription('Completer').setRequired(false);

const ogOption = new SlashCommandBooleanOption().setName('og').setDescription('filter for only OG completions/only non-OG').setRequired(false);

builder = new SlashCommandBuilder()
    .setName('2tc')
    .setDescription('Search and Browse Completed 2TC Index Combos')
    .addStringOption(entity1Option)
    .addStringOption(entity2Option)
    .addStringOption(mapOption)
    .addStringOption(personOption)
    .addBooleanOption(ogOption);

// Returns either { error } or { input }; `entities` (entity1, entity2) and `map` hold { kind, canonical } lookup results or null
function readInput(interaction) {
    const entities = [];
    for (const num of [1, 2]) {
        const entityArg = interaction.options.getString(`entity${num}`);
        let entity = null;
        if (entityArg) {
            entity = Towers.lookupTowerEntity(entityArg, { allowTowerPaths: true });
            if (!entity) return { error: `Entity${num} did not match a tower/upgrade/path/hero` };
            entity = Towers.baseTowerIfLowTier(entity);
        }
        entities.push(entity);
    }

    const mapArg = interaction.options.getString('map');
    let map = null;
    if (mapArg) {
        map = Aliases.lookupMultiple(mapArg, SUPERGROUPS.MAP);
        if (!map) return { error: `Map/Difficulty not valid` };
    }

    const person = interaction.options.getString('person')?.toLowerCase() || null;
    const og = interaction.options.getBoolean('og');

    return { input: { entities, map, person, og } };
}

async function fetch2tc(searchParams) {
    let res = await fetch('https://btd6index.win/fetch-2tc?' + searchParams);
    let resJson = await res.json();
    if ('error' in resJson) {
        throw new Error(resJson.error);
    }
    return resJson;
}

async function execute(interaction) {
    const { error, input } = readInput(interaction);
    if (error) {
        return await interaction.reply({
            content: error,
            flags: MessageFlags.Ephemeral
        });
    }
    await interaction.deferReply();

    // Tower paths have no index name, so they don't narrow the search
    const towers = providedEntityNames(input);
    const map = input.map?.kind === 'map' ? Aliases.toIndexNormalForm(input.map.canonical) : null;

    let og = input.og;
    if (og) og = og + 0; // cursed way to convert true into 1 (false remains 'false' and not 0 since we don't want to exclude OGs even when false)

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

async function displayCombos(interaction, resJson, input, searchParams) {
    const combos = resJson.results;

    if (combos.length == 0) {
        return await interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(embedTitleNoCombos(input))
                    .setColor(palered)
            ]
        });
    }

    // Only one combo found
    if (combos.length == 1) {

        let challengeEmbed = new Discord.EmbedBuilder()
            .setTitle(embedTitle(input, combos))
            .setColor(palered);

        const combo = combos[0];

        // i give up I'm hardcoding the fields to use for displaying a single combo ~hemi
        let fields = ['tower1', 'tower2', 'map', 'person'];
        // only OG combos have version and date infomation
        if (combo.og) fields.push('version', 'date');

        fields.forEach((field) => challengeEmbed.addFields([{ name: gHelper.toTitleCase(field), value: combo[field], inline: true }]));

        challengeEmbed.addFields([{ name: 'Link', value: Index.genCompletionLink(combo), inline: true }]);
        challengeEmbed.addFields([{ name: 'OG?', value: combo.og ? 'OG' : 'ALT', inline: true }]);

        if (combo.pending) challengeEmbed.setFooter({ text: "This completion is pending verification" });

        // add support server link
        challengeEmbed.addFields([{ name: 'Found something wrong?', value: `please report them [here](${discord})` }]);

        return await interaction.editReply({ embeds: [challengeEmbed] });

    } else {
        // Multiple combos found
        let OGSearchParams = new URLSearchParams(searchParams);
        OGSearchParams.set('og', 1);
        let resJson = await fetch2tc(OGSearchParams);
        let numOGCompletions = resJson.count;

        function setOtherDisplayFields(challengeEmbed) {
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
        return await Index.displayOneOrMultiplePagesNew(interaction, fetch2tc, searchParams, displayFields,
            completion => {

                const boldOg = (str) => completion.og ? `**${str}**` : str;
                const italicizePending = (str) => completion.pending ? `_${str}_` : str;
                const addTextDecoration = (str) => italicizePending(boldOg(str));

                let obj = {};

                // console.log(completion);

                let specifiedTower = providedDefinedEntityNames(input)[0];

                displayFields.forEach((field) => {
                    if (field == 'Link') obj.Link = addTextDecoration(Index.genCompletionLink(completion));
                    if (completion[field]) return obj[field] = addTextDecoration(completion[field]);
                    if (field == 'unspecified_tower') {
                        if (completion.tower1 == specifiedTower) obj.unspecified_tower = addTextDecoration(completion.tower2);
                        else if (completion.tower2 == specifiedTower) obj.unspecified_tower = addTextDecoration(completion.tower1);
                    }
                });
                return obj;
            }, setOtherDisplayFields);
    }
}

function getDisplayCols(input) {
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
function embedTitle(input, combos) {
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

function embedTitleNoCombos(input) {
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

// Index names of entity1 and entity2, skipping missing ones and tower paths
function providedEntityNames(input) {
    return input.entities.map((entity) => Towers.towerEntityIndexName(entity)).filter((el) => el);
}

// Index names of the entities that pin down one tower in a combo: tower upgrades first, then heroes
function providedDefinedEntityNames(input) {
    const namesOfKind = (kind) => input.entities.filter((entity) => entity?.kind === kind).map((entity) => Towers.towerEntityIndexName(entity));
    return [...namesOfKind('tower_upgrade'), ...namesOfKind('hero')];
}

module.exports = {
    data: builder,
    execute
};
