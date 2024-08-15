const MapParser = require('../parser/map-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
const PersonParser = require('../parser/person-parser');
const TowerParser = require('../parser/tower-parser');

const Parsed = require('../parser/parsed');

const { displayOneOrMultiplePagesNew, genCompletionLink } = require('../helpers/index.js');

const { paleorange } = require('../jsons/colors.json');

const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption } = require('discord.js');

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
    await interaction.deferReply();

    const validationFailure = validateInput(interaction);
    if (validationFailure) {
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    const parsed = parseAll(interaction).reduce(
        (combinedParsed, nextParsed) => combinedParsed.merge(nextParsed),
        new Parsed()
    );

    return await displayFttcFilterAll(interaction, parsed);
}

////////////////////////////////////////////////////////////
// Parsing SlashCommand Input
////////////////////////////////////////////////////////////

function parseMap(interaction) {
    const map = interaction.options.getString('map');
    if (map) {
        const canonicalMap = Aliases.getCanonicalForm(map);
        if (canonicalMap) {
            return CommandParser.parse([canonicalMap], new MapParser());
        } else {
            const parsed = new Parsed();
            parsed.addError('Canonical not found');
            return parsed;
        }
    } else return new Parsed();
}

function parseTower(interaction, num) {
    const tower = interaction.options.getString(`tower${num}`);
    if (tower) {
        const canonicalTower = Aliases.canonicizeArg(tower);
        if (canonicalTower) {
            return CommandParser.parse([canonicalTower], new TowerParser());
        } else {
            const parsed = new Parsed();
            parsed.addError('Canonical not found');
            return parsed;
        }
    } else return new Parsed();
}

function parsePerson(interaction) {
    const u = interaction.options.getString('person')?.toLowerCase();
    if (u) {
        return CommandParser.parse([`user#${u}`], new PersonParser());
    } else return new Parsed();
}

function parseNumTowerTypes(interaction) {
    const n = interaction.options.getInteger('num_tower_types');
    if (n || n == 0) {
        return CommandParser.parse([n], new NaturalNumberParser());
    } else return new Parsed();
}

function parseAll(interaction) {
    const parsedMap = parseMap(interaction);
    const parsedTower1 = parseTower(interaction, 1);
    const parsedTower2 = parseTower(interaction, 2);
    const parsedPerson = parsePerson(interaction);
    const parsedNumTowerTypes = parseNumTowerTypes(interaction);

    return [parsedMap, parsedTower1, parsedTower2, parsedNumTowerTypes, parsedPerson];
}

function validateInput(interaction) {
    let [parsedMap, parsedTower1, parsedTower2, parsedNumTowerTypes, ] = parseAll(interaction);

    if (parsedMap.hasErrors()) {
        return `Map not valid`;
    }

    if (parsedTower1.hasErrors()) {
        return 'Tower1 did not match a tower';
    }

    if (parsedTower2.hasErrors()) {
        return 'Tower2 did not match a tower';
    }

    const parsedTowers = parsedTower1.merge(parsedTower2);
    if (parsedTowers.towers && parsedTowers.towers.length > parsedNumTowerTypes.natural_number) {
        const formattedTowers = parsedTowers.towers.map((t) => Aliases.toIndexNormalForm(t));
        return `You searched more towers (${formattedTowers.join(', ')}) than the number of tower types you specified (${
            parsedNumTowerTypes.natural_number
        })`;
    }

    if (parsedMap.map && parsedNumTowerTypes.hasAny()) {
        return `Map + Number of Tower Types either conflict or are redundant; don't search both`;
    }
}

function keepOnlyOG(parsed) {
    return !parsed.hasAny() || (parsed.natural_number && !parsed.person && !parsed.tower);
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

function getUrlParams(parsed) {
    params = new URLSearchParams();

    if (parsed.map) {
        params.set('map', Aliases.toIndexNormalForm(parsed.map));
    }

    if (parsed.natural_number) {
        params.set('towercount', parsed.natural_number);
    }

    if (parsed.towers) {
        params.set('towerincludes', parsed.towers.map(t => `"${t}"`));
    }

    if (parsed.person) {
        params.set('person', parsed.person);
    }

    if(keepOnlyOG(parsed)) {
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
    druid_monkey: 'dru',
    spike_factory: 'spk',
    monkey_village: 'vil',
    engineer: 'eng',
    beast_handler: 'bst',
    mermonkey: 'mrm',
};

async function displayFttcFilterAll(interaction, parsed) {
    const fetchParams = getUrlParams(parsed);
    if ((await fetchFttc(fetchParams)).count <= 0) {
        return interaction.reply({
            embeds: [
                new Discord.EmbedBuilder().setTitle(titleNoCombos(parsed))
            ]
        });
    }
    fetchParams.set('count', '10');
    return await displayOneOrMultiplePagesNew(
        interaction, fetchFttc, fetchParams,
        includedColumns(parsed),
        completion => {
            const boldOg = (str) => completion.og ? `**${str}**` : str;

            const towers = JSON.parse(completion.towerset).map(tower => {
                const towerCanonical = Aliases.getCanonicalForm(tower);
                const towerAbbreviation = FTTC_TOWER_ABBREVIATIONS[towerCanonical].toUpperCase();
                return parsed.towers && parsed.towers.includes(towerCanonical)
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
                .setTitle(title(parsed))
                .setColor(paleorange)
                .setFooter({ text: `---\nAny OG completion(s) bolded` });
        }
    );
}

function includedColumns(parsed) {
    // Setup / Data consolidation
    let displayCols = ['Towers', 'Map', 'Person', 'Link'];

    if (parsed.person) {
        displayCols = displayCols.filter((col) => col != 'Person');
    }

    if (parsed.map) {
        displayCols = displayCols.filter((col) => col != 'Map');
    }

    if (displayCols.length === 4) {
        displayCols = displayCols.filter((col) => col != 'Person');
    }

    return displayCols;
}

function title(parsed) {
    // t = combos.length > 1 ? 'All FTTC Combos ' : 'Only FTTC Combo ';
    let t = 'All FTTC Combos ';
    if (parsed.person) t += `by ${parsed.person} `;
    if (parsed.natural_number) t += `with ${parsed.natural_number} towers `;
    if (parsed.map) t += `on ${Aliases.toIndexNormalForm(parsed.map)} `;
    if (parsed.towers) t += `including ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[0])} `;
    if (parsed.towers && parsed.towers[1]) t += `and ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[1])} `;
    return t.slice(0, t.length - 1);
}

function titleNoCombos(parsed) {
    let t = 'No FTTC Combos Found ';
    if (parsed.person) t += `by "${parsed.person}" `;
    if (parsed.natural_number) t += `with ${parsed.natural_number} towers `;
    if (parsed.map) t += `on ${Aliases.toIndexNormalForm(parsed.map)} `;
    if (parsed.towers) t += `including ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[0])} `;
    if (parsed.towers && parsed.towers[1]) t += `and ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[1])} `;
    return t.slice(0, t.length - 1);
}

module.exports = {
    data: builder,
    execute
};
