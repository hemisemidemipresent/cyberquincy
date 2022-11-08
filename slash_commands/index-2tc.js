const OrParser = require('../parser/or-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const TowerPathParser = require('../parser/tower-path-parser');
const TowerParser = require('../parser/tower-parser');
const HeroParser = require('../parser/hero-parser.js');

const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const PersonParser = require('../parser/person-parser');

const NaturalNumberParser = require('../parser/natural-number-parser.js');
const VersionParser = require('../parser/version-parser');

const Parsed = require('../parser/parsed');

const UserCommandError = require('../exceptions/user-command-error.js');

const clonedeep = require('lodash.clonedeep');

const gHelper = require('../helpers/general.js');
const Index = require('../helpers/index.js');
const Maps = require('../helpers/maps')

const { orange, palered } = require('../jsons/colors.json');

const { COLS } = require('../services/index/2tc_scraper');

const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption } = require('discord.js');

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

const versionOption = new SlashCommandStringOption()
    .setName('version')
    .setDescription('Version or Subversion')
    .setRequired(false);

const numberOption = new SlashCommandIntegerOption().setName('number').setDescription('Combo Number').setRequired(false);

const reloadOption = new SlashCommandStringOption()
    .setName('reload')
    .setDescription('Do you need to reload completions from the index but for a much slower runtime?')
    .setRequired(false)
    .addChoices({ name: 'Yes', value: 'yes' });

builder = new SlashCommandBuilder()
    .setName('2tc')
    .setDescription('Search and Browse Completed 2TC Index Combos')
    .addStringOption(entity1Option)
    .addStringOption(entity2Option)
    .addStringOption(mapOption)
    .addStringOption(personOption)
    .addStringOption(versionOption)
    .addIntegerOption(numberOption)
    .addStringOption(reloadOption);

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

function parseVersion(interaction) {
    const v = interaction.options.getString(`version`);
    if (v) {
        return CommandParser.parse([`v${v}`], new VersionParser());
    } else return new Parsed();
}

function parsePerson(interaction) {
    const u = interaction.options.getString('person')?.toLowerCase();
    if (u) {
        return CommandParser.parse([`user#${u}`], new PersonParser());
    } else return new Parsed();
}

function parseNumber(interaction) {
    const n = interaction.options.getInteger('number');
    if (n || n == 0) {
        return CommandParser.parse([n], new NaturalNumberParser());
    } else return new Parsed();
}

function parseAll(interaction) {
    const parsedEntity1 = parseEntity(interaction, 1);
    const parsedEntity2 = parseEntity(interaction, 2);
    const parsedMap = parseMap(interaction);
    const parsedPerson = parsePerson(interaction);
    const parsedVersion = parseVersion(interaction);
    const parsedNumber = parseNumber(interaction);

    return [parsedEntity1, parsedEntity2, parsedMap, parsedPerson, parsedVersion, parsedNumber];
}

function validateInput(interaction) {
    let [parsedEntity1, parsedEntity2, parsedMap, parsedPerson, parsedVersion, parsedNumber] = parseAll(interaction);

    if (parsedEntity1.hasErrors()) {
        return 'Entity1 did not match a tower/upgrade/path/hero';
    }

    if (parsedEntity2.hasErrors()) {
        return 'Entity2 did not match a tower/upgrade/path/hero';
    }

    if (parsedMap.hasErrors()) {
        return `Map/Difficulty not valid`;
    }

    if (parsedVersion.hasErrors()) {
        return `Parsed Version must be a number >= 1`;
    }

    if (parsedNumber.hasErrors()) {
        return `Combo Number must be >= 1`;
    }

    if ((parsedEntity1.hasAny() || parsedEntity2.hasAny()) && parsedNumber.hasAny()) {
        return `Entity + Combo Number either conflict or are redundant; don't enter both`;
    }

    if (parsedMap.hasAny() && parsedVersion.hasAny()) {
        return `Alt map completions don't have an associated version; don't search both map and version`;
    }
}

async function execute(interaction) {
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

    await interaction.deferReply();

    try {
        const forceReload = interaction.options.getString('reload') ? true : false;

        const allCombos = await Index.fetchInfo('2tc', forceReload);

        const mtime = Index.getLastCacheModified('2tc');

        const filteredCombos = filterCombos(clonedeep(allCombos), parsed);

        await displayCombos(interaction, filteredCombos, parsed, allCombos, mtime);
    } catch (e) {
        if (e instanceof UserCommandError) {
            await interaction.editReply({
                embeds: [new Discord.EmbedBuilder().setTitle(e.message).setColor(orange)]
            });
        } else {
            throw e;
        }
    }
}

function mapsNotPossible(combo) {
    const impossibleMapsPerTower = [1, 2].map((entityNum) => {
        const entity = combo[`TOWER_${entityNum}`].NAME;
        return Maps.mapsNotPossible(entity)
    })

    return [...new Set(impossibleMapsPerTower.flat())]
}

async function displayCombos(interaction, combos, parsed, allCombos, mtime) {
    if (combos.length == 0) {
        return await interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(embedTitleNoCombos(parsed))
                    .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`)
                    .setColor(palered)
            ]
        });
    }

    if (combos.length == 1 && Object.keys(combos[0].MAPS).length == 1) {
        let challengeEmbed = new Discord.EmbedBuilder()
            .setTitle(embedTitle(parsed, combos))
            .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`)
            .setColor(palered);

        const flatCombo = flattenCombo(clonedeep(combos[0]));
        const strippedCombo = stripCombo(clonedeep(flatCombo), parsed);
        const combo = orderCombo(clonedeep(strippedCombo));

        for (field in combo) {
            challengeEmbed.addFields([{ name: gHelper.toTitleCase(field), value: combo[field], inline: true }]);
        }

        challengeEmbed.addFields([{ name: 'OG?', value: flatCombo.OG ? 'OG' : 'ALT', inline: true }]);

        if (flatCombo.OG && !(parsed.map || parsed.version || parsed.person)) {
            const allCompletedMaps = Object.keys(allCombos.find((c) => c.NUMBER === flatCombo.NUMBER).MAPS);
            const ogMapAbbr = Maps.mapToIndexAbbreviation(Aliases.toAliasNormalForm(combo.MAP));

            // TODO: Midnight Mansion no heli in 2tc? Probably will never happen though
            let completedAltMapsFields = Index.altMapsFields(ogMapAbbr, allCompletedMaps, mapsNotPossible(combos[0]));

            challengeEmbed.addFields([{ name: '**Alt Maps**', value: completedAltMapsFields.field }]);

            if (completedAltMapsFields.footer) {
                challengeEmbed.setFooter({ text: completedAltMapsFields.footer });
            }
        }

        return await interaction.editReply({ embeds: [challengeEmbed] });
    } else {
        const fieldHeaders = getDisplayCols(parsed);

        const colData = Object.fromEntries(
            fieldHeaders.map((fieldHeader) => {
                return [fieldHeader, []];
            })
        );

        let numOGCompletions = 0;

        for (var i = 0; i < combos.length; i++) {
            for (map in combos[i].MAPS) {
                const combo = flattenCombo(clonedeep(combos[i]), map);

                for (let colIndex = 0; colIndex < fieldHeaders.length; colIndex++) {
                    const fieldHeader = fieldHeaders[colIndex];

                    let key = fieldHeader;

                    if (fieldHeader === 'UNSPECIFIED_TOWER') {
                        const providedEntity = parseProvidedDefinedEntities(parsed)[0];
                        const entity = {
                            NAME: providedEntity,
                            TYPE: Towers.getEntityType(providedEntity)
                        };
                        const towerNum = entityMatch(combos[i], entity);
                        const otherTowerNum = 3 - towerNum;
                        key = `TOWER_${otherTowerNum}`;
                    }

                    const bold = combo.OG && !includeOnlyOG(parsed) ? '**' : '';

                    colData[fieldHeader].push(`${bold}${combo[key]}${bold}`);
                }

                if (combo.OG) numOGCompletions += 1;
            }
        }

        function setOtherDisplayFields(challengeEmbed) {
            challengeEmbed
                .setTitle(embedTitle(parsed, combos))
                .setColor(palered)
                .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`);

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

        return await Index.displayOneOrMultiplePages(interaction, colData, setOtherDisplayFields);
    }
}

function getDisplayCols(parsed) {
    definiteTowers = parseProvidedDefinedEntities(parsed);
    if (parsed.person) {
        if (definiteTowers.length == 2) {
            return ['NUMBER', 'MAP', 'LINK'];
        } else if (definiteTowers.length == 1) {
            return ['UNSPECIFIED_TOWER', 'MAP', 'LINK'];
        } else if (parsed.map) {
            return ['TOWER_1', 'TOWER_2', 'LINK'];
        } else {
            return ['TOWER_1', 'TOWER_2', 'MAP'];
        }
    } else if (parsed.map_difficulty) {
        if (definiteTowers.length == 2 || parsed.natural_number) {
            return ['PERSON', 'MAP', 'LINK'];
        }
        if (definiteTowers.length == 1) {
            return ['UNSPECIFIED_TOWER', 'MAP', 'LINK'];
        } else {
            return ['NUMBER', 'MAP', 'LINK'];
        }
    } else if (definiteTowers.length == 2) {
        return ['NUMBER', 'PERSON', 'LINK'];
    } else if (parsed.tower_upgrade || parsed.hero) {
        return ['UNSPECIFIED_TOWER', 'PERSON', 'LINK'];
    } else if (parsed.version) {
        return ['NUMBER', 'TOWER_1', 'TOWER_2'];
    } else {
        return ['TOWER_1', 'TOWER_2', 'LINK'];
    }
}

function stripCombo(combo, parsed) {
    const wellDefinedTowers = []
        .concat(parsed.tower_upgrades)
        .concat(parsed.heroes)
        .filter((el) => el);

    if (parsed.natural_number) delete combo.NUMBER;
    if (wellDefinedTowers.length == 2) {
        delete combo.TOWER_1;
        delete combo.TOWER_2;
    }
    if (parsed.version || !combo.OG) delete combo.VERSION;
    if (parsed.map) delete combo.MAP;
    if (parsed.person) delete combo.PERSON;

    if (!combo.OG) delete combo.CURRENT;
    if (!combo.OG) delete combo.DATE;

    delete combo.OG;

    return combo;
}

function orderCombo(combo) {
    const ordering = Object.keys(COLS).filter((v) => v !== 'UPGRADES');
    let newCombo = {};
    ordering.forEach((key) => {
        if (combo[key]) newCombo[key] = combo[key];
    });
    return newCombo;
}

function flattenCombo(combo, map) {
    if (!map) map = Object.keys(combo.MAPS)[0];
    const subcombo = combo.MAPS[map];

    let flattenedCombo = combo;

    flattenedCombo.MAP = Maps.indexMapAbbreviationToNormalForm(map);
    flattenedCombo.PERSON = subcombo.PERSON;
    flattenedCombo.LINK = subcombo.LINK;
    flattenedCombo.OG = subcombo.OG;
    delete flattenedCombo.MAPS;

    for (var tn = 1; tn <= 2; tn++) {
        if (combo.OG) {
            flattenedCombo[`TOWER_${tn}`] = `${flattenedCombo[`TOWER_${tn}`].NAME} (${flattenedCombo[`TOWER_${tn}`].UPGRADE})`;
        } else {
            flattenedCombo[`TOWER_${tn}`] = flattenedCombo[`TOWER_${tn}`].NAME
        }
    }

    return flattenedCombo;
}

// include sampleCombo for the correct capitalization and punctuation
function embedTitle(parsed, combos) {
    const sampleCombo = combos[0];
    const multipleCombos = combos.length > 1 || Object.keys(combos[0].MAPS).length > 1;

    const towers = parsedProvidedEntities(parsed);
    const sampleMap = Object.keys(sampleCombo.MAPS)[0];

    let title = '';
    if (parsed.natural_number) title += `${gHelper.toOrdinalSuffix(sampleCombo.NUMBER)} 2TC Combo `;
    else title += multipleCombos ? 'All 2TC Combos ' : 'Only 2TC Combo ';
    if (parsed.person) title += `by ${sampleCombo.MAPS[sampleMap].PERSON} `;
    if (parsed.map) title += `on ${Maps.indexMapAbbreviationToNormalForm(parsed.map)} `;
    if (parsed.map_difficulty) title += `on ${Aliases.toIndexNormalForm(parsed.map_difficulty)} Maps `;
    for (var i = 0; i < towers.length; i++) {
        const tower = towers[i];
        if (i == 0) title += 'with ';
        else title += 'and ';
        title += `${Towers.formatEntity(tower)} `;
    }
    if (parsed.version) title += `in v${parsed.version} `;
    return title.slice(0, title.length - 1);
}

function embedTitleNoCombos(parsed) {
    const towers = parsedProvidedEntities(parsed);

    let title = 'No Combos found ';
    if (parsed.person) title += `by "${parsed.person}" `;
    if (parsed.map) title += `on ${Aliases.toIndexNormalForm(parsed.map)} `;
    if (parsed.map_difficulty) title += `on ${Aliases.toIndexNormalForm(parsed.map_difficulty)} Maps `;
    for (var i = 0; i < towers.length; i++) {
        tower = towers[i];
        if (i == 0) title += 'with ';
        else title += 'and ';
        title += `${Towers.formatEntity(tower)} `;
    }
    if (parsed.version) title += `in v${parsed.version} `;
    return title.slice(0, title.length - 1);
}

function filterCombos(filteredCombos, parsed) {
    if (parsed.natural_number) {
        const combo = filteredCombos[parsed.natural_number - 1];
        // Filter by combo # provided
        filteredCombos = combo ? [combo] : []; // Wrap single combo object in an array for consistency
    } else if (parsed.hero || parsed.tower_upgrade || parsed.tower || parsed.tower_path) {
        // Filter by towers/heroes provided
        if (parsed.heroes && parsed.heroes.length > 1) {
            throw new UserCommandError(
                `Combo cannot have more than 1 hero (${gHelper.toTitleCase(parsed.heroes.join(' + '))})`
            );
        }

        const providedEntities = parsedProvidedEntities(parsed);

        const entity1 = {
            NAME: providedEntities[0],
            TYPE: Towers.getEntityType(providedEntities[0])
        };

        const entity2 = providedEntities[1]
            ? {
                  NAME: providedEntities[1],
                  TYPE: Towers.getEntityType(providedEntities[1])
              }
            : null;

        filteredCombos = filteredCombos.filter((combo) => {
            towerNum = entityMatch(combo, entity1);
            if (!entity2) return towerNum != 0; // If only 1 tower-query, return true for the combo if there was a tower match

            otherTowerNum = entityMatch(combo, entity2, towerNum);
            return towerNum + otherTowerNum == 3; // Ensure that one tower matched to tower 1, other matched to tower 2
            // Note that failed matches return 0
        });
    }

    if (parsed.version) {
        filteredCombos = filteredCombos.filter((combo) => {
            if (parsed.version.includes('.')) {
                return parsed.version == combo.VERSION;
            } else {
                return parsed.version == combo.VERSION || combo.VERSION.startsWith(`${parsed.version}.`);
            }
        });
    }

    if (parsed.person) {
        function personFilter(_, completion) {
            return completion.PERSON.toString().toLowerCase().split(' ').join('_') == parsed.person.split(' ').join('_');
        }
        filteredCombos = filterByCompletion(personFilter, filteredCombos);
    }

    if (parsed.map) {
        const mapAbbr = Maps.mapToIndexAbbreviation(parsed.map);
        function mapFilter(map, _) {
            return map == mapAbbr;
        }
        filteredCombos = filterByCompletion(mapFilter, filteredCombos);
    }

    if (parsed.map_difficulty) {
        function mapDifficultyFilter(map, _) {
            const mapCanonical = Aliases.toAliasCanonical(map);
            return Maps.allMapsFromMapDifficulty(parsed.map_difficulty).includes(mapCanonical);
        }
        filteredCombos = filterByCompletion(mapDifficultyFilter, filteredCombos);
    }

    // Unless searching by map or person, the command user wants OG completions and not alt map spam
    if (includeOnlyOG(parsed)) {
        function ogFilter(_, completion) {
            return completion.OG;
        }
        filteredCombos = filterByCompletion(ogFilter, filteredCombos);
    }
    return filteredCombos;
}

function includeOnlyOG(parsed) {
    return parsed.version || (!parsed.person && !parsed.map && !parsed.map_difficulty);
}

function parseProvidedDefinedEntities(parsed) {
    return []
        .concat(parsed.tower_upgrades)
        .concat(parsed.heroes)
        .filter((el) => el); // Remove null items
}

function parsedProvidedEntities(parsed) {
    return []
        .concat(parsed.tower_upgrades)
        .concat(parsed.tower_paths)
        .concat(parsed.towers)
        .concat(parsed.heroes)
        .filter((el) => el); // Remove null items
}

function filterByCompletion(filter, combos) {
    for (let i = combos.length - 1; i >= 0; i--) {
        combos[i].MAPS = Object.keys(combos[i].MAPS)
            .filter((map) => filter(map, combos[i].MAPS[map]))
            .reduce((completion, map) => {
                completion[map] = combos[i].MAPS[map];
                return completion;
            }, {});

        if (Object.keys(combos[i].MAPS).length === 0) combos.splice(i, 1);
    }
    return combos;
}

function entityMatch(combo, entity, excludeMatch) {
    let comboTowers = [combo.TOWER_1, combo.TOWER_2];
    // If a match was previously made, we don't want to match to it again
    // This is to deal with `/2tc wiz wiz#bot` for necromancer wlp
    if (excludeMatch) {
        comboTowers[excludeMatch - 1] = null;
    }
    if (entity.TYPE == 'TOWER') {
        return (
            comboTowers
                .map((t) => {
                    if (!t) return null;
                    towerUpgrade = Aliases.toAliasNormalForm(t.NAME);
                    return Towers.towerUpgradeToTower(towerUpgrade);
                })
                .indexOf(entity.NAME) + 1
        );
    } else if (entity.TYPE == 'TOWER_UPGRADE') {
        return (
            comboTowers
                .map((t) => {
                    if (!t) return null;
                    towerUpgrade = Aliases.toAliasNormalForm(t.NAME);
                    return Aliases.getCanonicalForm(towerUpgrade);
                })
                .indexOf(entity.NAME) + 1
        );
    } else if (entity.TYPE == 'HERO') {
        return (
            comboTowers
                .map((t) => {
                    if (!t) return null;
                    return t.NAME.toLowerCase();
                })
                .indexOf(entity.NAME) + 1
        );
    } else if (entity.TYPE == 'TOWER_PATH') {
        return (
            comboTowers
                .map((t) => {
                    if (!t) return null;
                    upgradeArray = t.UPGRADE.split('-').map((u) => parseInt(u));
                    pathIndex = upgradeArray.indexOf(Math.max(...upgradeArray));
                    path = pathIndex == 0 ? 'top' : pathIndex == 1 ? 'middle' : 'bottom';

                    towerUpgrade = Aliases.toAliasNormalForm(t.NAME);
                    towerBase = Towers.towerUpgradeToTower(towerUpgrade);
                    return `${towerBase}#${path}-path`;
                })
                .indexOf(entity.NAME) + 1
        );
    } else {
        throw `Somehow received tower that is not in any of [tower, tower_upgrade, tower_path, hero]`;
    }
}

module.exports = {
    data: builder,
    execute
};
