const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const OrParser = require('../parser/or-parser.js');
const OptionalParser = require('../parser/optional-parser.js');
const AnyOrderParser = require('../parser/any-order-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const TowerPathParser = require('../parser/tower-path-parser');
const TowerParser = require('../parser/tower-parser');
const HeroParser = require('../parser/hero-parser.js');

const MapParser = require('../parser/map-parser.js');
const PersonParser = require('../parser/person-parser');

const NaturalNumberParser = require('../parser/natural-number-parser.js');
const VersionParser = require('../parser/version-parser');

const Parsed = require('../parser/parsed')

const UserCommandError = require('../exceptions/user-command-error.js');

const clonedeep = require('lodash.clonedeep');

const gHelper = require('../helpers/general.js');
const discordHelper = require('../helpers/discord.js');
const Index = require('../helpers/index.js');

const { orange, palered } = require('../jsons/colours.json');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const OG_COLS = {
    NUMBER: 'B',
    TOWER_1: 'C',
    TOWER_2: 'E',
    UPGRADES: 'G',
    MAP: 'I',
    VERSION: 'K',
    DATE: 'L',
    PERSON: 'M',
    LINK: 'O',
    CURRENT: 'P',
};

const ALT_COLS = {
    NUMBER: 'R',
    MAP: 'S',
    PERSON: 'U',
    LINK: 'W',
};

CACHE_FNAME_2TC = '2tc.json'

const { 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
    SlashCommandIntegerOption, 
} = require('@discordjs/builders');

const entity1Option = 
    new SlashCommandStringOption()
        .setName('entity1')
        .setDescription('Tower/Path/Upgrade/Hero')
        .setRequired(false)

const entity2Option = 
    new SlashCommandStringOption()
        .setName('entity2')
        .setDescription('Tower/Path/Upgrade/Hero')
        .setRequired(false)

const mapOption = 
    new SlashCommandStringOption()
        .setName('map')
        .setDescription('Map')
        .setRequired(false);

const personOption = 
    new SlashCommandStringOption()
        .setName('person')
        .setDescription('Completer')
        .setRequired(false);

const versionOption = 
    new SlashCommandStringOption()
        .setName('version')
        .setDescription('Version or Subversion')
        .setRequired(false)
    
const numberOption = 
    new SlashCommandIntegerOption()
        .setName('number')
        .setDescription('Combo Number')
        .setRequired(false)

const reloadOption =
    new SlashCommandStringOption()
        .setName('reload')
        .setDescription('Do you need to reload completions from the index but for a much slower runtime?')
        .setRequired(false)
        .addChoice('Yes', 'yes')

builder = 
    new SlashCommandBuilder()
        .setName('2tc')
        .setDescription('Search and Browse Completed 2TC Index Combos')
        .addStringOption(entity1Option)
        .addStringOption(entity2Option)
        .addStringOption(mapOption)
        .addStringOption(personOption)
        .addStringOption(versionOption)
        .addIntegerOption(numberOption)
        .addStringOption(reloadOption)

function parseEntity(interaction, num) {
    const entityParser = new OrParser(
        new TowerParser(),
        new TowerPathParser(),
        new TowerUpgradeParser(),
        new HeroParser(),
    )
    const entity = interaction.options.getString(`entity${num}`)
    if (entity) {
        const canonicalEntity = Aliases.canonicizeArg(entity)
        if (canonicalEntity) {
            return CommandParser.parse([canonicalEntity], entityParser)
        } else {
            const parsed = new Parsed()
            parsed.addError('Canonical not found')
            return parsed;
        }
    } else return new Parsed();
}

function parseMap(interaction) {
    const map = interaction.options.getString('map')
    if (map) {
        const canonicalMap = Aliases.getCanonicalForm(map)
        if (canonicalMap) {
            return CommandParser.parse([canonicalMap], new MapParser())
        } else {
            const parsed = new Parsed()
            parsed.addError('Canonical not found')
            return parsed;
        }
    } else return new Parsed();
}

function parseVersion(interaction) {
    const v = interaction.options.getString(`version`)
    if (v) {
        return CommandParser.parse([`v${v}`], new VersionParser(1))
    } else return new Parsed();
}

function parsePerson(interaction) {
    const u = interaction.options.getString('person')?.toLowerCase()
    if (u) {
        return CommandParser.parse([`user#${u}`], new PersonParser())
    } else return new Parsed();
}

function parseNumber(interaction) {
    const n = interaction.options.getInteger('number')
    if (n || n == 0) {
        return CommandParser.parse([n], new NaturalNumberParser())
    } else return new Parsed();
}

function parseAll(interaction) {
    const parsedEntity1 = parseEntity(interaction, 1)
    const parsedEntity2 = parseEntity(interaction, 2)
    const parsedMap = parseMap(interaction)
    const parsedPerson = parsePerson(interaction)
    const parsedVersion = parseVersion(interaction)
    const parsedNumber = parseNumber(interaction)

    return [parsedEntity1, parsedEntity2, parsedMap, parsedPerson, parsedVersion, parsedNumber];
}

function validateInput(interaction) {
    let [parsedEntity1, parsedEntity2, parsedMap, parsedPerson, parsedVersion, parsedNumber] = parseAll(interaction)

    if (parsedEntity1.hasErrors()) {
        return 'Entity1 did not match a tower/upgrade/path/hero'
    }

    if (parsedEntity2.hasErrors()) {
        return 'Entity2 did not match a tower/upgrade/path/hero'
    }

    if (parsedMap.hasErrors()) {
        return `Map not valid`
    }

    if (parsedVersion.hasErrors()) {
        return `Parsed Version must be a number >= 1`
    }

    if (parsedNumber.hasErrors()) {
        return `Combo Number must be >= 1`
    }

    if ((parsedEntity1.hasAny() || parsedEntity2.hasAny()) && parsedNumber.hasAny()) {
        return `Entity + Combo Number either conflict or are redundant; don't enter both`
    }

    if (parsedMap.hasAny() && parsedVersion.hasAny()) {
        return `Alt map completions don't have an associated version; don't search both map and version`
    }
}

async function execute(interaction) {
    const validationFailure =  validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({
            content: validationFailure,
            ephemeral: true,
        })
    }

    const parsed = parseAll(interaction).reduce(
        (combinedParsed, nextParsed) => combinedParsed.merge(nextParsed),
        new Parsed()
    )

    await interaction.deferReply()

    try {
        const forceReload = interaction.options.getString('reload') ? true : false

        let allCombos;
        if (Index.hasCachedCombos(CACHE_FNAME_2TC) && !forceReload) {
            allCombos = await Index.fetchCachedCombos(CACHE_FNAME_2TC)
        } else {
            allCombos = await scrapeAllCombos();
            Index.cacheCombos(allCombos, CACHE_FNAME_2TC)
        }

        const mtime = Index.getLastCacheModified(CACHE_FNAME_2TC)

        const filteredCombos = filterCombos(clonedeep(allCombos), parsed);
        
        await displayCombos(interaction, filteredCombos, parsed, allCombos, mtime);
    } catch (e) {
        if (e instanceof UserCommandError) {
            await interaction.editReply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setTitle(e.message)
                        .setColor(orange),
                ],
            });
        } else {
            throw e;
        }
    }
}

async function displayCombos(interaction, combos, parsed, allCombos, mtime) {
    if (combos.length == 0) {
        return await interaction.editReply({
            embeds: [
                new Discord.MessageEmbed()
                    .setTitle(embedTitleNoCombos(parsed))
                    .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`)
                    .setColor(palered),
            ],
        });
    }

    if (combos.length == 1) {
        let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(embedTitle(parsed, combos))
            .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`)
            .setColor(palered);

        const flatCombo = flattenCombo(clonedeep(combos[0]));
        const strippedCombo = stripCombo(clonedeep(flatCombo), parsed);
        const combo = orderCombo(clonedeep(strippedCombo));

        for (field in combo) {
            challengeEmbed.addField(
                gHelper.toTitleCase(field),
                combo[field],
                true
            );
        }

        challengeEmbed.addField('OG?', flatCombo.OG ? 'OG' : 'ALT', true);

        if (flatCombo.OG && !(parsed.map || parsed.version || parsed.person)) {
            const allCompletedMaps = Object.keys(
                allCombos.find((c) => c.NUMBER === flatCombo.NUMBER).MAPS
            );
            let altMaps = allCompletedMaps.filter((map) => map != combo.MAP);
            altMaps = altMaps.map((properMapName) =>
                properMapName.split(' ').join('_').toLowerCase()
            );
            altMaps = altMaps.map((properMapName) =>
                Aliases.mapToIndexAbbreviation(properMapName)
            );

            let mapGroups = [
                Aliases.beginnerMaps(),
                Aliases.intermediateMaps(),
                Aliases.advancedMaps(),
                Aliases.expertMaps(),
            ];
            mapGroups = mapGroups.map((aliases) =>
                aliases.map((alias) => Aliases.mapToIndexAbbreviation(alias))
            );

            const altMapGroups = mapGroups.map((mapGroup) =>
                mapGroup.filter((map) => altMaps.includes(map))
            );

            if (altMapGroups.some((group) => group.length > 0)) {
                let altMapsString = '';
                altMapsString += `\n${altMapGroups[0].join(', ')}`;
                altMapsString += `\n${altMapGroups[1].join(', ')}`;
                altMapsString += `\n${altMapGroups[2].join(', ')}`;
                altMapsString += `\n${altMapGroups[3].join(', ')}`;
                challengeEmbed.addField('**Alt Maps**', altMapsString);
            } else {
                challengeEmbed.addField('**Alt Maps**', 'None');
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

                for (
                    let colIndex = 0;
                    colIndex < fieldHeaders.length;
                    colIndex++
                ) {
                    const fieldHeader = fieldHeaders[colIndex];

                    let key = fieldHeader;

                    if (fieldHeader === 'UNSPECIFIED_TOWER') {
                        providedTower = parseProvidedDefinedTowers(parsed)[0];
                        towerNum = towerMatch(combos[i], providedTower);
                        otherTowerNum = 3 - towerNum;
                        key = `TOWER_${otherTowerNum}`;
                    }

                    const bold = combo.OG && !excludeOG(parsed) ? '**' : '';

                    colData[fieldHeader].push(`${bold}${combo[key]}${bold}`);
                }

                if (combo.OG) numOGCompletions += 1;
            }
        }

        return await displayOneOrMultiplePages(
            interaction,
            parsed,
            combos,
            colData,
            numOGCompletions,
            mtime
        );
    }
}

const multipageButtons = new MessageActionRow().addComponents(
    new MessageButton().setCustomId('-1').setLabel('⬅️').setStyle('PRIMARY'),
    new MessageButton().setCustomId('1').setLabel('➡️').setStyle('PRIMARY')
);

async function displayOneOrMultiplePages(
    interaction,
    parsed,
    combos,
    colData,
    numOGCompletions,
    mtime
) {
    MAX_NUM_ROWS = 15;
    const numRows = colData[Object.keys(colData)[0]].length;
    let leftIndex = 0;
    let rightIndex = Math.min(MAX_NUM_ROWS - 1, numRows - 1);

    /**
     * creates embed for next page
     * @param {int} direction
     * @returns {MessageEmbed}
     */
    async function createPage(direction = 1) {
        // The number of rows to be displayed is variable depending on the characters in each link
        // Try 15 and decrement every time it doesn't work.
        for (
            maxNumRowsDisplayed = MAX_NUM_ROWS;
            maxNumRowsDisplayed > 0;
            maxNumRowsDisplayed--
        ) {
            let challengeEmbed = new Discord.MessageEmbed()
                .setTitle(embedTitle(parsed, combos))
                .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`)
                .setColor(palered);

            challengeEmbed.addField(
                '# Combos',
                `**${leftIndex + 1}**-**${rightIndex + 1}** of ${numRows}`
            );

            for (header in colData) {
                const data =
                    numRows <= maxNumRowsDisplayed
                        ? colData[header]
                        : colData[header].slice(leftIndex, rightIndex + 1);

                challengeEmbed.addField(
                    gHelper.toTitleCase(header.split('_').join(' ')),
                    data.join('\n'),
                    true
                );
            }

            if (!excludeOG(parsed)) {
                if (numOGCompletions == 1) {
                    challengeEmbed.setFooter({ text: `---\nOG completion bolded` });
                }
                if (numOGCompletions > 1) {
                    challengeEmbed.setFooter({
                        text: `---\n${numOGCompletions} OG completions bolded`
                    });
                }
            }

            if (discordHelper.isValidFormBody(challengeEmbed)) return [challengeEmbed, numRows > maxNumRowsDisplayed];

            if (direction > 0) rightIndex--;
            if (direction < 0) leftIndex++;
        }
    }

    async function displayPages(direction = 1) {
        let [embed, multipage] = await createPage(direction);

        await interaction.editReply({
            embeds: [embed],
            components: multipage ? [multipageButtons] : [],
        });

        if (!multipage) return;

        const filter = (selection) => {
            // Ensure user clicking button is same as the user that started the interaction
            if (selection.user.id !== interaction.user.id) {
                return false;
            }
            // Ensure that the button press corresponds with this interaction and wasn't
            // a button press on the previous interaction
            if (selection.message.interaction.id !== interaction.id) {
                return false;
            }
            return true;
        };

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: 'BUTTON',
            time: 20000
        });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            buttonInteraction.deferUpdate();

            switch (parseInt(buttonInteraction.customId)) {
                case -1:
                    rightIndex = (leftIndex - 1 + numRows) % numRows;
                    leftIndex = rightIndex - (MAX_NUM_ROWS - 1);
                    if (leftIndex < 0) leftIndex = 0;
                    await displayPages(-1);
                    break;
                case 1:
                    leftIndex = (rightIndex + 1) % numRows;
                    rightIndex = leftIndex + (MAX_NUM_ROWS - 1);
                    if (rightIndex >= numRows) rightIndex = numRows - 1;
                    await displayPages(1);
                    break;
            }
        });

        collector.on('end', async (collected) => {
            if (collected.size == 0) {
                await interaction.editReply({
                    embeds: [embed],
                    components: []
                });
            }
        });
    }

    // Gets the reaction to the pagination message by the command author
    // and respond by turning the page in the correction direction

    await displayPages(1);
}

function getDisplayCols(parsed) {
    definiteTowers = parseProvidedDefinedTowers(parsed);
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
    const ordering = Object.keys(OG_COLS).filter((v) => v !== 'UPGRADES');
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

    flattenedCombo.MAP = map;
    flattenedCombo.PERSON = subcombo.PERSON;
    flattenedCombo.LINK = subcombo.LINK;
    flattenedCombo.OG = subcombo.OG;
    delete flattenedCombo.MAPS;

    for (var tn = 1; tn <= 2; tn++) {
        flattenedCombo[`TOWER_${tn}`] = `${
            flattenedCombo[`TOWER_${tn}`].NAME
        } (${flattenedCombo[`TOWER_${tn}`].UPGRADE})`;
    }

    return flattenedCombo;
}

// include sampleCombo for the correct capitalization and punctuation
function embedTitle(parsed, combos) {
    const sampleCombo = combos[0];
    const multipleCombos =
        combos.length > 1 || Object.keys(combos[0].MAPS).length > 1;

    const towers = parsedProvidedTowers(parsed);
    const map = Object.keys(sampleCombo.MAPS)[0];

    let title = '';
    if (parsed.natural_number)
        title += `${gHelper.toOrdinalSuffix(sampleCombo.NUMBER)} 2TC Combo `;
    else title += multipleCombos ? 'All 2TC Combos ' : 'Only 2TC Combo ';
    if (parsed.person) title += `by ${sampleCombo.MAPS[map].PERSON} `;
    if (parsed.map) title += `on ${map} `;
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
    const towers = parsedProvidedTowers(parsed);

    let title = 'No Combos found ';
    if (parsed.person) title += `by "${parsed.person}" `;
    if (parsed.map) title += `on ${Aliases.toIndexNormalForm(parsed.map)} `;
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
    } else if (
        parsed.hero ||
        parsed.tower_upgrade ||
        parsed.tower ||
        parsed.tower_path
    ) {
        // Filter by towers/heroes provided
        if (parsed.heroes && parsed.heroes.length > 1) {
            throw new UserCommandError(
                `Combo cannot have more than 1 hero (${gHelper.toTitleCase(
                    parsed.heroes.join(' + ')
                )})`
            );
        }

        const providedTowers = parsedProvidedTowers(parsed);

        filteredCombos = filteredCombos.filter((combo) => {
            towerNum = towerMatch(combo, providedTowers[0]);
            if (!providedTowers[1]) return towerNum != 0; // If only 1 tower-query, return true for the combo if there was a tower match

            otherTowerNum = towerMatch(combo, providedTowers[1], towerNum);
            return towerNum + otherTowerNum == 3; // Ensure that one tower matched to tower 1, other matched to tower 2
            // Note that failed matches return 0
        });
    }

    if (parsed.version) {
        filteredCombos = filteredCombos.filter((combo) => {
            if (parsed.version.includes('.')) {
                return parsed.version == combo.VERSION;
            } else {
                return (
                    parsed.version == combo.VERSION ||
                    combo.VERSION.startsWith(`${parsed.version}.`)
                );
            }
        });
    }

    if (parsed.person) {
        function personFilter(_, completion) {
            return completion.PERSON.toString().toLowerCase() == parsed.person;
        }
        filteredCombos = filterByCompletion(personFilter, filteredCombos);
    }

    if (parsed.map) {
        function mapFilter(map, _) {
            return Aliases.toAliasNormalForm(map) == parsed.map;
        }
        filteredCombos = filterByCompletion(mapFilter, filteredCombos);
    }

    // Unless searching by map or person, the command user wants OG completions and not alt map spam
    if (excludeOG(parsed)) {
        function ogFilter(_, completion) {
            return completion.OG;
        }
        filteredCombos = filterByCompletion(ogFilter, filteredCombos);
    }
    return filteredCombos;
}

function excludeOG(parsed) {
    return parsed.version || (!parsed.person && !parsed.map);
}

function parseProvidedDefinedTowers(parsed) {
    return []
        .concat(parsed.tower_upgrades)
        .concat(parsed.heroes)
        .filter((el) => el); // Remove null items
}

function parsedProvidedTowers(parsed) {
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

function towerMatch(combo, tower, excludeMatch) {
    let comboTowers = [combo.TOWER_1, combo.TOWER_2];
    // If a match was previously made, we don't want to match to it again
    // This is to deal with `/2tc wiz wiz#bot` for necromancer wlp
    if (excludeMatch) {
        comboTowers[excludeMatch - 1] = null
    }
    if (Towers.isTower(tower)) {
        return (
            comboTowers
                .map((t) => {
                    if (!t) return null;
                    towerUpgrade = Aliases.toAliasNormalForm(t.NAME);
                    return Towers.towerUpgradeToTower(towerUpgrade);
                })
                .indexOf(tower) + 1
        );
    } else if (Towers.isTowerUpgrade(tower)) {
        return (
            comboTowers
                .map((t) => {
                    if (!t) return null;
                    towerUpgrade = Aliases.toAliasNormalForm(t.NAME);
                    return Aliases.getCanonicalForm(towerUpgrade);
                })
                .indexOf(tower) + 1
        );
    } else if (Aliases.isHero(tower)) {
        return (
            comboTowers
                .map((t) => {
                    if (!t) return null;
                    return t.NAME.toLowerCase();
                })
                .indexOf(tower) + 1
        );
    } else if (Towers.isTowerPath(tower)) {
        return (
            comboTowers
                .map((t) => {
                    if (!t) return null;
                    upgradeArray = t.UPGRADE.split('-').map((u) => parseInt(u));
                    pathIndex = upgradeArray.indexOf(Math.max(...upgradeArray));
                    path =
                        pathIndex == 0
                            ? 'top'
                            : pathIndex == 1
                            ? 'middle'
                            : 'bottom';

                    towerUpgrade = Aliases.toAliasNormalForm(t.NAME);
                    towerBase = Towers.towerUpgradeToTower(towerUpgrade);
                    return `${towerBase}#${path}-path`;
                })
                .indexOf(tower) + 1
        );
    } else {
        throw `Somehow received tower that is not in any of [tower, tower_upgrade, tower_path, hero]`;
    }
}

function sheet2TC() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');
}

async function scrapeAllCombos() {
    const ogCombos = await scrapeAllOGCombos();
    const altCombos = await scrapeAllAltCombos();
    return mergeCombos(ogCombos, altCombos);
}

function mergeCombos(ogCombos, altCombos) {
    let mergedCombos = [];

    for (var i = 0; i < ogCombos.length; i++) {
        const toBeMergedOgCombo = ogCombos[i];

        const map = toBeMergedOgCombo.MAP;
        delete toBeMergedOgCombo.MAP; // Incorporated as key of outer Object within array index

        const person = toBeMergedOgCombo.PERSON;
        delete toBeMergedOgCombo.PERSON; // Incorporated as key-value pair in comboObject

        const link = toBeMergedOgCombo.LINK;
        delete toBeMergedOgCombo.LINK; // Incorporated as key-value pair in comboObject

        const comboObject = {
            ...toBeMergedOgCombo,
            MAPS: {},
        };
        comboObject.MAPS[map] = {
            PERSON: person,
            LINK: link,
            OG: true,
        };

        mergedCombos.push(comboObject);
    }

    for (var i = 0; i < altCombos.length; i++) {
        const toBeMergedAltCombo = altCombos[i];

        const n = gHelper.fromOrdinalSuffix(toBeMergedAltCombo.NUMBER);
        delete toBeMergedAltCombo.NUMBER;

        const map = toBeMergedAltCombo.MAP;
        delete toBeMergedAltCombo.MAP;

        mergedCombos[n - 1].MAPS[map] = {
            ...toBeMergedAltCombo,
            OG: false,
        };
    }

    return mergedCombos;
}

async function scrapeAllOGCombos() {
    const sheet = sheet2TC();
    const nCombos = await numCombos();
    const rOffset = await findOGRowOffset();

    let ogCombos = [];

    await sheet.loadCells(
        `${OG_COLS.NUMBER}${rOffset + 1}:${OG_COLS.CURRENT}${rOffset + nCombos}`
    );

    let row;
    for (var n = 1; n <= nCombos; n++) {
        row = rOffset + n;

        ogCombos.push(await getOG2TCFromPreloadedRow(row));
    }

    return ogCombos;
}

async function scrapeAllAltCombos() {
    const sheet = sheet2TC();
    const rOffset = await findOGRowOffset();

    await sheet.loadCells(
        `${ALT_COLS.NUMBER}${rOffset + 1}:${ALT_COLS.LINK}${sheet.rowCount}`
    );

    let altCombos = [];

    for (var row = rOffset + 1; row <= sheet.rowCount; row++) {
        if (await hasGonePastLastAlt2TCCombo(row)) break;

        altCombos.push(await getAlt2TCFromPreloadedRow(row));
    }

    return altCombos;
}

async function numCombos() {
    const sheet = sheet2TC();
    await sheet.loadCells(`J6`);
    return sheet.getCellByA1('J6').value;
}

////////////////////////////////////////////////////////////
// OG Combos
////////////////////////////////////////////////////////////

async function getOG2TCFromPreloadedRow(row) {
    const sheet = sheet2TC();

    // Assign each value to be discord-embedded in a simple default way
    let values = {};
    for (key in OG_COLS) {
        values[key] = sheet.getCellByA1(`${OG_COLS[key]}${row}`).value;
    }

    const upgrades = values.UPGRADES.split('|').map((u) =>
        u.replace(/^\s+|\s+$/g, '')
    );
    for (var i = 0; i < upgrades.length; i++) {
        // Display upgrade next to tower
        values[`TOWER_${i + 1}`] = {
            NAME: values[`TOWER_${i + 1}`],
            UPGRADE: upgrades[i],
        };
    }
    delete values.UPGRADES; // Don't display upgrades on their own, display with towers

    // Recapture date to format properly
    values.DATE = sheet.getCellByA1(`${OG_COLS.DATE}${row}`).formattedValue;

    // Recapture link to format properly
    const linkCell = sheet.getCellByA1(`${OG_COLS.LINK}${row}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;
    values.VERSION = values.VERSION.toString();

    // Replace checkmark that doesn't display in embedded with one that does
    if (values.CURRENT === gHelper.HEAVY_CHECK_MARK) {
        values.CURRENT = gHelper.WHITE_HEAVY_CHECK_MARK;
    }

    return values;
}

async function findOGRowOffset() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');

    const MIN_OFFSET = 1;
    const MAX_OFFSET = 20;

    await sheet.loadCells(
        `${OG_COLS.NUMBER}${MIN_OFFSET}:${OG_COLS.NUMBER}${MAX_OFFSET}`
    );

    for (var row = MIN_OFFSET; row <= MAX_OFFSET; row++) {
        const cellValue = sheet.getCellByA1(`B${row}`).value;
        if (cellValue) {
            if (cellValue.toLowerCase().includes('number')) {
                return row;
            }
        }
    }

    throw `Cannot find 2TC header "Number" to orient combo searching`;
}

////////////////////////////////////////////////////////////
// Alt Combos
////////////////////////////////////////////////////////////

async function getAlt2TCFromPreloadedRow(row) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');

    // Assign each value to be discord-embedded in a simple default way
    let values = {};
    for (key in ALT_COLS) {
        values[key] = sheet.getCellByA1(`${ALT_COLS[key]}${row}`).value;
    }

    // Format link properly
    const linkCell = sheet.getCellByA1(`${ALT_COLS.LINK}${row}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    while (!values.NUMBER) {
        values.NUMBER = sheet.getCellByA1(`${ALT_COLS.NUMBER}${--row}`).value;
    }

    return values;
}

async function hasGonePastLastAlt2TCCombo(row) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');

    return !sheet.getCellByA1(`${ALT_COLS.PERSON}${row}`).value;
}

module.exports = {
    data: builder,
    execute
};
