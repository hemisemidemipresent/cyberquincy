// btw rml I kinda updated it to use the website but it is quite scuffed so sorry if i bastardized your code
const OrParser = require('../parser/or-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const TowerPathParser = require('../parser/tower-path-parser');
const TowerParser = require('../parser/tower-parser');
const HeroParser = require('../parser/hero-parser.js');

const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const PersonParser = require('../parser/person-parser');

const Parsed = require('../parser/parsed');

const gHelper = require('../helpers/general.js');
const Index = require('../helpers/index.js');
const Maps = require('../helpers/maps');

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

function parseEntity(interaction, num) {
    const entityParser = new OrParser(new TowerParser(), new TowerPathParser(), new TowerUpgradeParser(), new HeroParser());
    const entity = interaction.options.getString(`entity${num}`);
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
    const u = interaction.options.getString('person')?.toLowerCase();
    if (u) {
        return CommandParser.parse([`user#${u}`], new PersonParser());
    } else return new Parsed();
}

function parseAll(interaction) {
    const parsedEntity1 = parseEntity(interaction, 1);
    const parsedEntity2 = parseEntity(interaction, 2);
    const parsedMap = parseMap(interaction);
    const parsedPerson = parsePerson(interaction);

    return [parsedEntity1, parsedEntity2, parsedMap, parsedPerson];
}

function validateInput(interaction) {
    let [parsedEntity1, parsedEntity2, parsedMap] = parseAll(interaction);

    if (parsedEntity1.hasErrors()) {
        return 'Entity1 did not match a tower/upgrade/path/hero';
    }

    if (parsedEntity2.hasErrors()) {
        return 'Entity2 did not match a tower/upgrade/path/hero';
    }

    if (parsedMap.hasErrors()) {
        return `Map/Difficulty not valid`;
    }
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
    const validationFailure = validateInput(interaction);
    if (validationFailure) {
        return await interaction.reply({
            content: validationFailure,
            flags: MessageFlags.Ephemeral
        });
    }
    await interaction.deferReply();

    // I give up on anything remotely elegant to construct the request from the parsed output ~hemi
    const parsed = parseAll(interaction);

    const e1 = parsed[0];
    const e2 = parsed[1];

    // we have to check if what was inputted is a tower (upgrade) name, a tower upgrade directly or a hero
    const entityType1 = e1.tower ? Aliases.toIndexNormalForm(e1.tower) : null;
    const entity1 = e1.tower_upgrade ? Towers.towerUpgradeToIndexNormalForm(e1.tower_upgrade) : null;
    const hero1 = e1.hero ? Aliases.toIndexNormalForm(e1.hero) : null;

    const entityType2 = e2.tower ? Aliases.toIndexNormalForm(e2.tower) : null;
    const entity2 = e2.tower_upgrade ? Towers.towerUpgradeToIndexNormalForm(e2.tower_upgrade) : null;
    const hero2 = e2.hero ? Aliases.toIndexNormalForm(e2.hero) : null;

    let newparsed = parsed.reduce(
        (combinedParsed, nextParsed) => combinedParsed.merge(nextParsed),
        new Parsed()
    );
    newparsed.entity1 = entityType1 ?? entity1 ?? hero1;
    newparsed.entity2 = entityType2 ?? entity2 ?? hero2;

    const towers = [newparsed.entity1, newparsed.entity2].filter(val => val);
    const map = newparsed.map ? Aliases.toIndexNormalForm(newparsed.map) : null;

    let og = interaction.options.getBoolean('og');
    if (og) og = og + 0; // cursed way to convert true into 1 (false remains 'false' and not 0 since we don't want to exclude OGs even when false)
    
    // after all that wrangling, construct the search parameters to btd6 index API
    const searchParams = new URLSearchParams(
        Object.entries({
            towerquery: JSON.stringify(towers),
            map,
            person: newparsed.person,
            difficulty: newparsed.map_difficulty,
            pending: '0',
            count: '100',
            og: og
        }).filter(([, value]) => value !== null && value !== undefined)
    );

    let resJson = await fetch2tc(searchParams);

    await displayCombos(interaction, resJson, newparsed, searchParams);
}

async function displayCombos(interaction, resJson, parsed, searchParams) {
    const combos = resJson.results;

    if (combos.length == 0) {
        return await interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(embedTitleNoCombos(parsed))
                    .setColor(palered)
            ]
        });
    }

    // Only one combo found
    if (combos.length == 1) {

        let challengeEmbed = new Discord.EmbedBuilder()
            .setTitle(embedTitle(parsed, combos))
            .setColor(palered);

        const combo = combos[0];

        // i give up I'm hardcoding the fields to use for displaying a single combo ~hemi
        let fields = ['tower1', 'tower2', 'map', 'person'];
        // only OG combos have version and date infomation
        if (combo.og) fields.push('version', 'date');

        fields.forEach((field) => challengeEmbed.addFields([{ name: gHelper.toTitleCase(field), value: combo[field], inline: true }]));

        challengeEmbed.addFields([{ name: 'Link', value: Index.genCompletionLink(combo), inline: true }]);
        challengeEmbed.addFields([{ name: 'OG?', value: combo.og ? 'OG' : 'ALT', inline: true }]);

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
                .setTitle(embedTitle(parsed, combos))
                .setColor(palered);

            if (!includeOnlyOG(parsed)) {
                if (numOGCompletions == 1) {
                    challengeEmbed.setFooter({ text: `---\nOG completion bolded` });
                }
                if (numOGCompletions > 1) {
                    challengeEmbed.setFooter({
                        text: `---\n${numOGCompletions} OG completions bolded`
                    });
                }
            }
        }

        const displayFields = getDisplayCols(parsed);
        searchParams.set('count', '10');

        // "Magic function" for pagination
        return await Index.displayOneOrMultiplePagesNew(interaction, fetch2tc, searchParams, displayFields,
            completion => {

                const boldOg = (str) => completion.og ? `**${str}**` : str;

                let obj = {};

                let specifiedTower = parseProvidedDefinedEntities(parsed)[0];

                displayFields.forEach((field) => {
                    if (field == 'Link') obj.Link = boldOg(Index.genCompletionLink(completion));
                    if (completion[field]) return obj[field] = boldOg(completion[field]);
                    if (field == 'unspecified_tower') {
                        if (completion.tower1 == specifiedTower) obj.unspecified_tower = boldOg(completion.tower2);
                        else if (completion.tower2 == specifiedTower) obj.unspecified_tower = boldOg(completion.tower1);
                    }
                });
                return obj;
            }, setOtherDisplayFields);
    }
}

function getDisplayCols(parsed) {
    definiteTowers = parseProvidedDefinedEntities(parsed);
    if (parsed.person) {
        if (definiteTowers.length == 2) {
            return ['version', 'map', 'Link'];
        } else if (definiteTowers.length == 1) {
            return ['unspecified_tower', 'map', 'Link'];
        } else if (parsed.map) {
            return ['tower1', 'tower2', 'Link'];
        } else {
            return ['tower1', 'tower2', 'map'];
        }
    } else if (parsed.map_difficulty) {
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
function embedTitle(parsed, combos) {
    const multipleCombos = combos.length > 1;

    const towers = parseProvidedEntities(parsed);

    let title = multipleCombos ? 'All 2TC Combos ' : 'Only 2TC Combo ';
    if (parsed.person) title += `by ${parsed.person} `;
    if (parsed.map) title += `on ${Maps.indexMapAbbreviationToNormalForm(parsed.map)} `;
    if (parsed.map_difficulty) title += `on ${Aliases.toIndexNormalForm(parsed.map_difficulty)} Maps `;
    for (let i = 0; i < towers.length; i++) {
        const tower = towers[i];
        if (i == 0) title += 'with ';
        else title += 'and ';
        title += `${tower} `;
    }
    if (parsed.version) title += `in v${parsed.version} `;
    return title.slice(0, title.length - 1);
}

function embedTitleNoCombos(parsed) {
    const towers = parseProvidedEntities(parsed);

    let title = 'No Combos found ';
    if (parsed.person) title += `by "${parsed.person}" `;
    if (parsed.map) title += `on ${Aliases.toIndexNormalForm(parsed.map)} `;
    if (parsed.map_difficulty) title += `on ${Aliases.toIndexNormalForm(parsed.map_difficulty)} Maps `;
    for (let i = 0; i < towers.length; i++) {
        tower = towers[i];
        if (i == 0) title += 'with ';
        else title += 'and ';
        title += `${tower} `;
    }
    if (parsed.version) title += `in v${parsed.version} `;
    return title.slice(0, title.length - 1);
}

function includeOnlyOG(parsed) {
    return parsed.version || (!parsed.person && !parsed.map && !parsed.map_difficulty);
}

function parseProvidedEntities(parsed) {
    return [parsed.entity1, parsed.entity2]
        .filter((el) => el); // Remove null items
}

function parseProvidedDefinedEntities(parsed) {
    return []
        .concat(parsed.tower_upgrades?.map(upgrade => Towers.towerUpgradeToIndexNormalForm(upgrade)))
        .concat(parsed.heroes?.map(hero => Aliases.toIndexNormalForm(hero)))
        .filter((el) => el); // Remove null items
}

module.exports = {
    data: builder,
    execute
};
