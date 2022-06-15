const MapParser = require('../parser/map-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
const PersonParser = require('../parser/person-parser');
const TowerParser = require('../parser/tower-parser');

const Parsed = require('../parser/parsed');

const gHelper = require('../helpers/general.js');
const Index = require('../helpers/index.js');

const { paleorange } = require('../jsons/colours.json');

const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption } = require('@discordjs/builders');

const mapOption = new SlashCommandStringOption().setName('map').setDescription('Map').setRequired(false);

const tower1Option = new SlashCommandStringOption().setName('tower1').setDescription('A Tower').setRequired(false);

const tower2Option = new SlashCommandStringOption().setName('tower2').setDescription('A Tower').setRequired(false);

const numTowerTypesOption = new SlashCommandIntegerOption()
    .setName('num_tower_types')
    .setDescription('Number of tower types')
    .setRequired(false);

const personOption = new SlashCommandStringOption().setName('person').setDescription('Completer').setRequired(false);

const reloadOption = new SlashCommandStringOption()
    .setName('reload')
    .setDescription('Do you need to reload completions from the index but for a much slower runtime?')
    .setRequired(false)
    .addChoices({ name: 'Yes', value: 'yes' });

builder = new SlashCommandBuilder()
    .setName('fttc')
    .setDescription('Search and Browse Completed FTTC Index Combos')
    .addStringOption(mapOption)
    .addStringOption(tower1Option)
    .addStringOption(tower2Option)
    .addIntegerOption(numTowerTypesOption)
    .addStringOption(personOption)
    .addStringOption(reloadOption);

async function execute(interaction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    const parsed = parseAll(interaction).reduce(
        (combinedParsed, nextParsed) => combinedParsed.merge(nextParsed),
        new Parsed()
    );

    await interaction.deferReply();

    const forceReload = interaction.options.getString('reload') ? true : false;

    const allCombos = await Index.fetchCombos('fttc', (reload = forceReload));

    const mtime = Index.getLastCacheModified('fttc');

    let filteredCombos = filterResults(allCombos, parsed);

    if (filteredCombos.length == 0) {
        const noCombosEmbed = new Discord.MessageEmbed().setTitle(titleNoCombos(parsed)).setColor(paleorange);

        return interaction.editReply({ embeds: [noCombosEmbed] });
    } else {
        return await embedOneOrMultiplePages(interaction, parsed, filteredCombos, mtime);
    }
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
    let [parsedMap, parsedTower1, parsedTower2, parsedNumTowerTypes, _] = parseAll(interaction);

    if (parsedMap.hasErrors()) {
        return `Map not valid`;
    }

    if (parsedTower1.hasErrors()) {
        return 'Tower1 did not match a tower';
    }

    if (parsedTower2.hasErrors()) {
        return 'Tower2 did not match a towe';
    }

    if (parsedNumTowerTypes.hasErrors()) {
        return `Number of Combos must be >= 1`;
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

function filterResults(allCombos, parsed) {
    results = allCombos;

    if (parsed.map) {
        results = results.filter((combo) => Aliases.toAliasNormalForm(combo.MAP) == parsed.map);
    }

    if (parsed.natural_number) {
        results = results.filter((combo) => combo.TOWERS.length === parsed.natural_number);
    }

    if (parsed.person) {
        results = results.filter((combo) => {
            return combo.PERSON.toLowerCase().split(' ').join('_') === parsed.person.toLowerCase().split(' ').join('_');
        });
    }

    if (parsed.towers) {
        results = results.filter((combo) => parsed.towers.every((specifiedTower) => combo.TOWERS.includes(specifiedTower)));
    }

    if (keepOnlyOG(parsed) || !parsed.hasAny()) {
        results = results.filter((combo) => combo.OG);
    }

    return results;
}

function keepOnlyOG(parsed) {
    return parsed.natural_number && !parsed.person && !parsed.tower;
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
    engineer: 'eng'
};

async function embedOneOrMultiplePages(interaction, parsed, combos, mtime) {
    // Setup / Data consolidation
    let displayCols = ['TOWERS', 'MAP', 'PERSON', 'LINK'];

    if (parsed.person) {
        displayCols = displayCols.filter((col) => col != 'PERSON');
    }

    if (parsed.map) {
        displayCols = displayCols.filter((col) => col != 'MAP');
    }

    if (displayCols.length === 4) {
        displayCols = displayCols.filter((col) => col != 'PERSON');
    }
    const colData = Object.fromEntries(
        displayCols.map((col) => {
            if (col == 'TOWERS') {
                const boldedAbbreviatedTowers = combos.map((combo) =>
                    combo[col].map((tower) => {
                        if (tower) {
                            const towerCanonical = Aliases.getCanonicalForm(tower);
                            const towerAbbreviation = FTTC_TOWER_ABBREVIATIONS[towerCanonical].toUpperCase();
                            return parsed.towers && parsed.towers.includes(towerCanonical)
                                ? `**${towerAbbreviation}**`
                                : towerAbbreviation;
                        }
                    })
                );
                const colValues = boldedAbbreviatedTowers.map((comboTowers, i) => {
                    let value = comboTowers.join(' | ');
                    if (combos[i].OG && !parsed.towers) {
                        value = `**${value}**`;
                    }
                    return value;
                });
                return [col, colValues];
            } else {
                const colValues = combos.map((combo) => {
                    value = combo[col];
                    if (combo.OG) {
                        value = `**${value}**`;
                    }
                    return value;
                });
                return [col, colValues];
            }
        })
    );

    const numOGCompletions = combos.filter((combo) => combo.OG).length;

    function setOtherDisplayFields(challengeEmbed) {
        challengeEmbed
            .setTitle(embedTitle(parsed, combos))
            .setColor(paleorange)
            .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`);

        if (numOGCompletions == 1) {
            challengeEmbed.setFooter({ text: `---\nOG completion bolded` });
        }
        if (numOGCompletions > 1) {
            challengeEmbed.setFooter({
                text: `---\n${numOGCompletions} OG completions bolded`
            });
        }
    }

    return await Index.displayOneOrMultiplePages(interaction, colData, setOtherDisplayFields);
}

function embedTitle(parsed, combos) {
    t = combos.length > 1 ? 'All FTTC Combos ' : 'Only FTTC Combo ';
    if (parsed.person) t += `by ${combos[0].PERSON} `;
    if (parsed.natural_number) t += `with ${parsed.natural_number} towers `;
    if (parsed.map) t += `on ${combos[0].MAP} `;
    if (parsed.towers) t += `including ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[0])} `;
    if (parsed.towers && parsed.towers[1]) t += `and ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[1])} `;
    return t.slice(0, t.length - 1);
}

function titleNoCombos(parsed) {
    t = 'No FTTC Combos Found ';
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
