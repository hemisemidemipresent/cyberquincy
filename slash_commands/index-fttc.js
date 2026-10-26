const Aliases = require('../aliases');

const { displayOneOrMultiplePagesNew, genCompletionLink } = require('../helpers/index.js');
const Towers = require('../helpers/towers');

const { paleorange } = require('../jsons/colors.json');

const { MessageFlags, SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption } = require('discord.js');

const mapOption = new SlashCommandStringOption().setName('map').setDescription('Map').setRequired(false);

const tower1Option = new SlashCommandStringOption().setName('tower1').setDescription('A Tower').setRequired(false);

const tower2Option = new SlashCommandStringOption().setName('tower2').setDescription('A Tower').setRequired(false);

const numTowerTypesOption = new SlashCommandIntegerOption()
    .setName('num_tower_types')
    .setDescription('Number of tower types')
    .setMinValue(1)
    .setRequired(false);

const personOption = new SlashCommandStringOption().setName('person').setDescription('Completer').setRequired(false);

builder = new SlashCommandBuilder()
    .setName('fttc')
    .setDescription('Search and Browse Completed FTTC Index Combos')
    .addStringOption(mapOption)
    .addStringOption(tower1Option)
    .addStringOption(tower2Option)
    .addIntegerOption(numTowerTypesOption)
    .addStringOption(personOption);

async function execute(interaction) {
    const { error, input } = readInput(interaction);
    if (error) {
        return await interaction.reply({
            content: error,
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.deferReply();

    return await displayFttcFilterAll(interaction, input);
}

////////////////////////////////////////////////////////////
// Reading SlashCommand Input
////////////////////////////////////////////////////////////

// Returns either { error } or { input }; `map` and `towers` hold canonicals from alias lookups
function readInput(interaction) {
    const mapArg = interaction.options.getString('map');
    let map = null;
    if (mapArg) {
        map = Aliases.lookup(mapArg, 'map');
        if (!map) return { error: `Map not valid` };
    }

    const towers = [];
    for (const num of [1, 2]) {
        const towerArg = interaction.options.getString(`tower${num}`);
        if (!towerArg) continue;
        const tower = Aliases.lookup(towerArg, 'tower');
        if (!tower) return { error: `Tower${num} did not match a tower` };
        towers.push(tower);
    }

    // Discord already enforces a minimum of 1
    const numTowerTypes = interaction.options.getInteger('num_tower_types') || null;
    const person = interaction.options.getString('person')?.toLowerCase() || null;

    if (numTowerTypes && towers.length > numTowerTypes) {
        const formattedTowers = towers.map((t) => Aliases.toIndexNormalForm(t));
        return {
            error: `You searched more towers (${formattedTowers.join(', ')}) than the number of tower types you specified (${numTowerTypes})`
        };
    }

    if (map && numTowerTypes) {
        return { error: `Map + Number of Tower Types either conflict or are redundant; don't search both` };
    }

    return { input: { map, towers, numTowerTypes, person } };
}

function keepOnlyOG({ map, towers, numTowerTypes, person }) {
    const hasAny = map || towers.length > 0 || numTowerTypes || person;
    return !hasAny || (numTowerTypes && !person && towers.length === 0);
}

////////////////////////////////////////////////////////////
// Fetch Combos
////////////////////////////////////////////////////////////

async function fetchFttc(searchParams) {
    let res = await fetch('https://btd6index.win/fetch-fttc?' + searchParams);
    let resJson = await res.json();
    if ('error' in resJson) {
        throw new Error(resJson.error);
    }
    return resJson;
}

function getUrlParams(input) {
    const params = new URLSearchParams();

    if (input.map) {
        params.set('map', Aliases.toIndexNormalForm(input.map));
    }

    if (input.numTowerTypes) {
        params.set('towercount', input.numTowerTypes);
    }

    if (input.towers.length > 0) {
        params.set('towerincludes', input.towers.map(t => `"${t}"`));
    }

    if (input.person) {
        params.set('person', input.person);
    }

    if(keepOnlyOG(input)) {
        params.set('og', 1);
    }

    params.set('count', 0);

    return params;
}

////////////////////////////////////////////////////////////
// Display Combos
////////////////////////////////////////////////////////////

const FTTC_TOWER_ABBREVIATIONS = {
    dart_monkey: 'drt',
    boomerang_monkey: 'boo',
    bomb_shooter: 'bmb',
    tack_shooter: 'tac',
    ice_monkey: 'ice',
    glue_gunner: 'glu',
    sniper_monkey: 'sni',
    desperado: 'des',
    monkey_sub: 'sub',
    monkey_buccaneer: 'buc',
    monkey_ace: 'ace',
    heli_pilot: 'hel',
    mortar_monkey: 'mor',
    dartling_gunner: 'dlg',
    wizard_monkey: 'wiz',
    super_monkey: 'sup',
    ninja_monkey: 'nin',
    alchemist: 'alc',
    druid: 'dru',
    mermonkey: 'mrm',
    spike_factory: 'spk',
    monkey_village: 'vil',
    engineer_monkey: 'eng',
    beast_handler: 'bst',
};

async function displayFttcFilterAll(interaction, input) {
    const fetchParams = getUrlParams(input);
    if ((await fetchFttc(fetchParams)).count <= 0) {
        return interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder().setTitle(titleNoCombos(input))
            ]
        });
    }
    fetchParams.set('count', '10');
    return await displayOneOrMultiplePagesNew(
        interaction, fetchFttc, fetchParams,
        includedColumns(input),
        completion => {
            const boldOg = (str) => completion.og ? `**${str}**` : str;

            const towers = completion.towerset.map(tower => {
                const towerCanonical = Aliases.lookup(tower, 'tower');
                const towerAbbreviation = FTTC_TOWER_ABBREVIATIONS[towerCanonical].toUpperCase();
                return input.towers.includes(towerCanonical)
                    ? `**${towerAbbreviation}**`
                    : towerAbbreviation;
            }).join(' | ');

            return {
                'Towers': boldOg(towers),
                'Map': boldOg(completion.map),
                'Person': boldOg(completion.person),
                'Link': boldOg(genCompletionLink(completion))
            };
        },
        embed => {
            embed
                .setTitle(title(input))
                .setColor(paleorange)
                .setFooter({ text: `---\nAny OG completion(s) bolded` });
        }
    );
}

function includedColumns(input) {
    // Setup / Data consolidation
    let displayCols = ['Towers', 'Map', 'Person', 'Link'];

    if (input.person) {
        displayCols = displayCols.filter((col) => col != 'Person');
    }

    if (input.map) {
        displayCols = displayCols.filter((col) => col != 'Map');
    }

    if (displayCols.length === 4) {
        displayCols = displayCols.filter((col) => col != 'Person');
    }

    return displayCols;
}

function title(input) {
    // t = combos.length > 1 ? 'All FTTC Combos ' : 'Only FTTC Combo ';
    let t = 'All FTTC Combos ';
    if (input.person) t += `by ${input.person} `;
    if (input.numTowerTypes) t += `with ${input.numTowerTypes} towers `;
    if (input.map) t += `on ${Aliases.toIndexNormalForm(input.map)} `;
    if (input.towers[0]) t += `including ${Aliases.toIndexNormalForm(input.towers[0])} `;
    if (input.towers[1]) t += `and ${Aliases.toIndexNormalForm(input.towers[1])} `;
    return t.slice(0, t.length - 1);
}

function titleNoCombos(input) {
    let t = 'No FTTC Combos Found ';
    if (input.person) t += `by "${input.person}" `;
    if (input.numTowerTypes) t += `with ${input.numTowerTypes} towers `;
    if (input.map) t += `on ${Aliases.toIndexNormalForm(input.map)} `;
    if (input.towers[0]) t += `including ${Aliases.toIndexNormalForm(input.towers[0])} `;
    if (input.towers[1]) t += `and ${Aliases.toIndexNormalForm(input.towers[1])} `;
    return t.slice(0, t.length - 1);
}

module.exports = {
    data: builder,
    execute
};
