const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const gHelper = require('../helpers/general.js');
const Index = require('../helpers/index.js');

const { paleblue } = require('../jsons/colours.json');
const { MessageActionRow, MessageButton, BaseGuildEmojiManager } = require('discord.js');

const COLS = {
    NUMBER: 'B',
    TOWER: 'C',
    UPGRADES: 'E',
    OG_MAP: 'F',
    VERSION: 'H',
    DATE: 'I',
    PERSON: 'J',
    LINK: 'L',
};

const TOWER_COLS = {
    TOWER: 'O',
    BASE: 'P',
    LAST: 'Y',
};

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);
RED_X = String.fromCharCode(10060);

const { 
    SlashCommandBuilder, 
    SlashCommandStringOption,
} = require('@discordjs/builders');

const Towers = require('../helpers/towers');

CACHE_FNAME_2MP = '2mp.json'

let entityOption = 
    new SlashCommandStringOption()
        .setName('entity')
        .setDescription('Hero/Tower/Upgrade')
        .setRequired(false);

let mapOption = 
    new SlashCommandStringOption()
        .setName('map')
        .setDescription('Map/Difficulty')
        .setRequired(false);

let userOption =
    new SlashCommandStringOption()
        .setName('person')
        .setDescription('Person')
        .setRequired(false);

const reloadOption =
    new SlashCommandStringOption()
        .setName('reload')
        .setDescription('Do you need to reload completions from the index but for a much slower runtime?')
        .setRequired(false)
        .addChoice('Yes', 'yes')

builder = new SlashCommandBuilder()
    .setName('2mp')
    .setDescription('Search and Browse Completed 2MP Index Combos')
    .addStringOption(entityOption)
    .addStringOption(mapOption)
    .addStringOption(userOption)
    .addStringOption(reloadOption)

const OrParser = require('../parser/or-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');
const TowerParser = require('../parser/tower-parser.js')
const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const EmptyParser = require('../parser/empty-parser.js');
const Parsed = require('../parser/parsed.js');
const UserCommandError = require('../exceptions/user-command-error.js');

function parseEntity(interaction) {
    entityParser = new OrParser(
        new TowerParser(),
        new TowerUpgradeParser(),
        new HeroParser(),
        new EmptyParser(),
    )
    entity = interaction.options.getString('entity')
    if (entity) {
        canonicalEntity = Aliases.getCanonicalForm(entity)
        if (canonicalEntity) {
            return CommandParser.parse([canonicalEntity], entityParser)
        } else {
            parsed = new Parsed()
            parsed.addError('Canonical not found')
            return parsed;
        }
    } else return null;
}

function parseMap(interaction) {
    mapParser = new OrParser(
        new MapParser(),
        new MapDifficultyParser(),
    )
    map = interaction.options.getString('map')
    if (map) {
        canonicalMap = Aliases.getCanonicalForm(map)
        if (canonicalMap) {
            return CommandParser.parse([canonicalMap], mapParser)
        } else {
            parsed = new Parsed()
            parsed.addError('Canonical not found')
            return parsed;
        }
    } else return null;
}

function parseAll(interaction) {
    parsedEntity = parseEntity(interaction)
    parsedMap = parseMap(interaction)
    person = interaction.options.getString('person')?.toLowerCase()
    return [parsedEntity, parsedMap, person];
}

function validateInput(interaction) {
    let [parsedEntity, parsedMap, person] = parseAll(interaction)

    if (parsedEntity?.hasErrors())
        return `Entity ${entity} didn't match tower/upgrade/hero, including aliases`

    if (parsedMap?.hasErrors())
        return `Map/Difficulty ${map} didn't match, including aliases`
    
    if ((parsedEntity?.tower_upgrade || parsedEntity?.hero) && parsedMap?.map && person) {
        return "Don't search a person if you're already narrowing down your search to a specific completion"
    }
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({ 
            content: validationFailure, 
            ephemeral: true
        });
    }

    let [parsedEntity, parsedMap, person] = parseAll(interaction)

    await interaction.deferReply({ ephemeral: true })

    const forceReload = interaction.options.getString('reload') ? true : false

    console.log('yeah')

    let allCombos;
    if (Index.hasCachedCombos(CACHE_FNAME_2MP) && !forceReload) {
        console.log('woah')
        allCombos = await Index.fetchCachedCombos(CACHE_FNAME_2MP)           
    } else {
        allCombos = await scrapeAllCombos();
        return interaction.editReply({ content: 'yeet' })
        return
        Index.cacheCombos(allCombos, CACHE_FNAME_2MP)
    }

    return

    const mtime = Index.getLastCacheModified(CACHE_FNAME_2MP)

    if (parsedEntity?.tower && !parsedMap && !person) {
        const challengeEmbed = await display2MPTowerStatistics(parsedEntity.tower)
        return interaction.reply({
            embeds: [challengeEmbed],
        })
    }

    // Simple displays
    if ((parsedEntity?.tower_upgrade || parsedEntity?.hero) && !parsedMap?.map_difficulty && !person) {
        let challengeEmbed;
        entity = parsedEntity?.hero || Towers.towerUpgradeToIndexNormalForm(parsedEntity?.tower_upgrade)

        if (parsedMap?.map) {
            try {
                challengeEmbed = await display2MPAlt(entity, parsedMap.map)
            } catch(e) {
                challengeEmbed = err(e)
            }
        } else {
            try {
                challengeEmbed = await display2MPOG(entity)
            } catch(e) {
                challengeEmbed = err(e)
            }
        }

        return interaction.editReply({
            embeds: [challengeEmbed],
        })
    }

    if ((parsedEntity?.tower_upgrade || parsedEntity?.hero) && parsedMap?.map_difficulty && !person) {
        try {
            entity = parsedEntity?.hero || Towers.towerUpgradeToIndexNormalForm(parsedEntity?.tower_upgrade)
            const challengeEmbed = await display2MPMapDifficulty(entity, parsedMap.map_difficulty)
            return interaction.editReply({
                embeds: [challengeEmbed]
            })
        } catch(e) {
            return interaction.editReply({
                embeds: [err(e)]
            })
        }
    }

    return await display2MPFilterAll(interaction)
}

async function scrapeAllCombos() {
    console.log('hea')
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    // Load TOWER and MAP columns
    let [startRow, endRow] = await rowBoundaries();
    await sheet.loadCells(`${COLS.TOWER}${startRow}:${COLS.LINK}${endRow}`);

    let combos = []

    // Retrieve og- and alt-map notes from each tower row
    for (var row = startRow; row <= endRow; row++) {
        const entity = sheet.getCellByA1(`${COLS.TOWER}${row}`).value;

        const towerMapNotes = parsePreloadedMapNotesWithOG(row);
        console.log(towerMapNotes)
    }

    return combos;
}

// Displays all 2MPCs completed on all maps specified by the map difficulty
async function display2MPMapDifficulty(entity, mapDifficulty) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    const mapDifficultyFormatted = gHelper.toTitleCase(mapDifficulty);
    const towerFormatted = gHelper.toTitleCase(entity.split('_').join(' '));

    const entryRow = await rowFromTower(entity);

    // Load the map cell, person cell, link cell and a few in between
    await sheet.loadCells(`${COLS.OG_MAP}${entryRow}:${COLS.LINK}${entryRow}`);

    const notes = parsePreloadedMapNotesWithOG(entryRow);

    // Get all map abbreviations for the specified map difficulty
    const permittedMapAbbrs = Aliases[`${mapDifficulty}Maps`]().map((map) =>
        Aliases.mapToIndexAbbreviation(map)
    );
    // Filter the completion entries by the permitted maps specified by the command-entered map difficulty
    const relevantNotes = Object.keys(notes)
        .filter((noteMapAbbr) => permittedMapAbbrs.includes(noteMapAbbr))
        .reduce((relevantNote, noteMapAbbr) => {
            relevantNote[noteMapAbbr] = notes[noteMapAbbr];
            return relevantNote;
        }, {});

    const numCombosCompleted = Object.keys(relevantNotes).length;
    const ogCompletionPresent = Object.values(relevantNotes).some((v) => v.OG);

    if (numCombosCompleted > 0) {
        // Format 3 columns: map, person, link
        let mapColumn = [];
        let personColumn = [];
        let linkColumn = [];
        for (const mapAbbr in relevantNotes) {
            const bold = relevantNotes[mapAbbr].OG ? '**' : '';

            mapColumn.push(
                `${bold}${Aliases.indexMapAbbreviationToNormalForm(mapAbbr)}${bold}`
            );
            personColumn.push(`${bold}${relevantNotes[mapAbbr].PERSON}${bold}`);
            linkColumn.push(`${bold}${relevantNotes[mapAbbr].LINK}${bold}`);
        }
        mapColumn = mapColumn.join('\n');
        personColumn = personColumn.join('\n');
        linkColumn = linkColumn.join('\n');

        const mapsLeft = permittedMapAbbrs.filter(
            (m) => !Object.keys(relevantNotes).includes(m)
        );

        // Check if tower is water tower
        let impossibleMaps = [];
        if (Towers.isWaterTowerUpgrade(entity)) {
            // Calculate impossible maps (those that do not contain any water)
            nonWaterMaps = Aliases.allNonWaterMaps().map((m) =>
                Aliases.mapToIndexAbbreviation(m)
            );
            impossibleMaps = mapsLeft.filter((m) => nonWaterMaps.includes(m));

            mapsLeft = mapsLeft.filter((m) => !impossibleMaps.includes(m));
        }

        // Embed and send the message
        let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(
                `${towerFormatted} 2MPCs on ${mapDifficultyFormatted} Maps`
            )
            .setColor(paleblue);

        const numCombosPossible = permittedMapAbbrs.length - impossibleMaps.length;
        let possiblePhrasing;
        if (mapsLeft.length > 0) {
            possiblePhrasing =
                impossibleMaps.length > 0 ? ' (that are possible)' : '';
            challengeEmbed.addField(
                `Combos${possiblePhrasing}`,
                `**${numCombosCompleted}**/${numCombosPossible}`
            );
        } else {
            possiblePhrasing = impossibleMaps.length > 0 ? ' possible' : '';
            challengeEmbed.addField(
                `All${possiblePhrasing} ${mapDifficulty} maps completed`,
                '-'.repeat(40)
            );
        }

        challengeEmbed
            .addField('Map', mapColumn, true)
            .addField('Person', personColumn, true)
            .addField('Link', linkColumn, true);

        if (impossibleMaps.length > 0) {
            challengeEmbed.addField(
                'Impossible maps',
                impossibleMaps.join(', ')
            );
        }

        if (mapsLeft.length > 0) {
            challengeEmbed.addField('Maps Left', mapsLeft.join(', '));
        }

        if (ogCompletionPresent)
            challengeEmbed.setFooter({ text: '----\nOG completion bolded' });

        return challengeEmbed;
    } else {
        throw new UserCommandError(
            `Tower \`${towerFormatted}\` has not yet been completed on any \`${mapDifficulty}\` maps`
        );
    }
}

function filterCombo(interaction, comboEntity, c) {
    let [parsedEntity, parsedMap, person] = parseAll(interaction)

    const matchesPerson = person ? person === c.PERSON.toLowerCase() : true

    let matchesEntity = true
    if (parsedEntity) {
        comboEntity = Aliases.getCanonicalForm(Aliases.toAliasNormalForm(comboEntity))
        if (parsedEntity.tower) {
            if (Towers.isTowerUpgrade(comboEntity)) {
                matchesEntity = Towers.towerUpgradeToTower(comboEntity) == parsedEntity.tower;
            } else { // Hero
                matchesEntity = false
            }
        } else { // Tower upgrade or hero
            matchesEntity = comboEntity == (parsedEntity.tower_upgrade || parsedEntity.hero);
        }
    }

    let matchesMap = true
    if (parsedMap) {
        const comboMap = Aliases.indexMapAbbreviationToMap(c.MAP)
        if (parsedMap.map_difficulty) {
            matchesMap = Aliases.allMapsFromMapDifficulty(parsedMap.map_difficulty).includes(comboMap)
        } else { // Map
            matchesMap = parsedMap.map == comboMap
        }
    }

    return matchesPerson && matchesEntity && matchesMap;
}

function titleFunction(interaction) {
    let [parsedEntity, parsedMap, person] = parseAll(interaction)

    title = 'All 2MPs'
    if (parsedEntity?.tower) {
        title += ` with ${Aliases.toIndexNormalForm(parsedEntity.tower)}`
    } else if (parsedEntity?.tower_upgrade) {
        title += ` with ${Towers.towerUpgradeToIndexNormalForm(parsedEntity.tower_upgrade)}`
    } else if (parsedEntity?.hero) {
        title += ` with ${Aliases.toIndexNormalForm(parsedEntity.hero)}`
    }

    if (parsedMap?.map) {
        title += ` on ${Aliases.toIndexNormalForm(parsedMap.map)}`
    } else if (parsedMap?.map_difficulty) {
        title += ` on ${Aliases.toIndexNormalForm(parsedMap.map_difficulty)} maps`
    }

    if (person) {
        title += ` by ${person}`
    }

    return title;
}

function excludedColumnsFunction(interaction) {
    let [parsedEntity, parsedMap, person] = parseAll(interaction)
    
    let excludedColumns = []

    if (parsedEntity?.tower_upgrade || parsedEntity?.hero) {
        excludedColumns.push('entity')
    }

    if (parsedMap?.map) {
        excludedColumns.push('map')
    }

    if (person) {
        excludedColumns.push('person')
    }

    return excludedColumns;
}

async function display2MPFilterAll(interaction) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    // Load TOWER and MAP columns
    let [startRow, endRow] = await rowBoundaries();
    await sheet.loadCells(`${COLS.TOWER}${startRow}:${COLS.LINK}${endRow}`);

    // Collect data from 4 columns: tower, map, person, link
    // Only 3 can be used maximum to format a discord embed
    let towerColumn = [];
    let personColumn = [];
    let linkColumn = [];
    let mapColumn = [];

    let numOGCompletions = 0;

    // Retrieve og- and alt-map notes from each tower row
    for (var row = startRow; row <= endRow; row++) {
        const entity = sheet.getCellByA1(`${COLS.TOWER}${row}`).value;

        const towerMapNotes = parsePreloadedMapNotesWithOG(row);
        for (map in towerMapNotes) {
            const note = {
                MAP: map,
                ...towerMapNotes[map],
            };

            if (!filterCombo(interaction, entity, note)) {
                continue;
            }

            const bold = note.OG ? '**' : '';
            if (note.OG) numOGCompletions += 1;

            towerColumn.push(`${bold}${entity}${bold}`);
            mapColumn.push(`${bold}${note.MAP}${bold}`);
            linkColumn.push(`${bold}${note.LINK}${bold}`);
            personColumn.push(`${bold}${note.PERSON}${bold}`);
        }
    }

    const title = titleFunction(interaction);

    // If no combos were found after filtering
    if (towerColumn.length == 0) {
        try {
            return message.channel.send(noCombosMessage);
        } catch (e) {
            console.log(e.name);
        }
    }

    const excludedColumns = excludedColumnsFunction(interaction)

    // Exclude columns from data output based on function input
    let columns = {};
    if (!excludedColumns.includes('entity')) columns.TOWER = towerColumn;
    if (!excludedColumns.includes('map')) columns.MAP = mapColumn;
    if (!excludedColumns.includes('person')) columns.PERSON = personColumn;
    columns.LINK = linkColumn;

    // Paginate if there are too many combos to display at once
    if (columns.LINK.length > MAX_VALUES_LIST_LENGTH_2MP) {
        return await embedPages(interaction, title, columns, numOGCompletions);
    }

    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(title)
        .addField('#Combos', columns.LINK.length.toString())
        .setColor(paleblue);

    // Display the non-excluded columns
    for (columnHeader in columns) {
        challengeEmbed.addField(
            gHelper.toTitleCase(columnHeader),
            columns[columnHeader].join('\n'),
            true
        );
    }

    if (numOGCompletions == 1) {
        challengeEmbed.setFooter({ text: `---\nOG completion bolded` });
    }
    if (numOGCompletions > 1) {
        challengeEmbed.setFooter({
            text: `---\n${numOGCompletions} OG completions bolded`
        });
    }

    return interaction.editReply({ embeds: [challengeEmbed] });
}

const multipageButtons = new MessageActionRow().addComponents(
    new MessageButton().setCustomId('-1').setLabel('⬅️').setStyle('PRIMARY'),
    new MessageButton().setCustomId('1').setLabel('➡️').setStyle('PRIMARY'),
    new MessageButton()
        .setCustomId('mobile')
        .setLabel('📱')
        .setStyle('SECONDARY')
);

//  If >MAX_VALUES_LIST_LENGTH_2MP combos are found, it paginates the results; navigation is driven by emoji reactions
async function embedPages(interaction, title, columns, numOGCompletions) {
    let mobile = false;
    columnChunks = {};
    for (columnHeader in columns) {
        columnChunks[columnHeader] = gHelper.chunk(
            columns[columnHeader],
            MAX_VALUES_LIST_LENGTH_2MP
        );
    }

    // Divide results into chunks of MAX_VALUES_LIST_LENGTH_2MP
    numPages = columnChunks.LINK.length;
    pg = 0;

    async function displayCurrentPage() {
        const startCombo = pg * MAX_VALUES_LIST_LENGTH_2MP + 1;
        const endCombo = Math.min(
            (pg + 1) * MAX_VALUES_LIST_LENGTH_2MP,
            columns[Object.keys(columns)[0]].length
        );

        challengeEmbed = new Discord.MessageEmbed()
            .setTitle(title)
            .setColor(paleblue)
            .addField(
                'Combos',
                `**${startCombo}-${endCombo}** of ${columns.LINK.length}`
            );
        if (mobile) {
            let arr = Array(endCombo - startCombo + 1 + 1).fill(''); // first +1 is because 1-12 contains 12 combos, the other +1 is for the titles (TOWER, PERSON, LINK)

            for (columnHeader in columnChunks) {
                let obj = columnChunks[columnHeader];
                let page = obj[pg];
                page.unshift(columnHeader);
                let max = gHelper.longestStrLength(page);
                for (let i = 0; i < page.length; i++) {
                    if (columnHeader != 'LINK')
                        arr[i] += '`' + gHelper.addSpaces(page[i], max) + '`|';
                    else arr[i] += page[i];
                }
                page.shift(columnHeader);
            }

            challengeEmbed.setDescription(arr.join('\n'));
        } else {
            for (columnHeader in columnChunks) {
                challengeEmbed.addField(
                    columnHeader,
                    columnChunks[columnHeader][pg].join('\n'),
                    true
                );
            }
        }

        if (numOGCompletions == 1) {
            challengeEmbed.setFooter({text: `---\nOG completion bolded`});
        }
        if (numOGCompletions > 1) {
            challengeEmbed.setFooter({
                text: `---\n${numOGCompletions} total OG completions bolded`
            });
        }

        await interaction.editReply({
            embeds: [challengeEmbed],
            components: [multipageButtons]
        });

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
        }

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: 'BUTTON',
            time: 20000,
        });
        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            buttonInteraction.deferUpdate();

            if (buttonInteraction.customId == 'mobile') {
                mobile = !mobile;
            } else {
                switch (parseInt(buttonInteraction.customId)) {
                    case -1:
                        pg--;
                        break;
                    case 1:
                        pg++;
                        break;
                }
                pg += numPages; // Avoid negative numbers
                pg %= numPages;
            }
            await displayCurrentPage();
        });

        collector.on('end', async (collected) => {
            if (collected.size == 0) {
                await interaction.editReply({
                    embeds: [challengeEmbed],
                    components: []
                });
            }
        });
    }

    displayCurrentPage();
}

// Assumes appropriate cells are loaded beforehand!
function parsePreloadedMapNotesWithOG(row) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    ogMapCell = sheet.getCellByA1(`${COLS.OG_MAP}${row}`);
    ogMapAbbr = Aliases.mapToIndexAbbreviation(
        Aliases.toAliasNormalForm(ogMapCell.value)
    );
    ogPerson = sheet.getCellByA1(`${COLS.PERSON}${row}`).value;
    ogLinkCell = sheet.getCellByA1(`${COLS.LINK}${row}`);

    notes = {};
    // Add OG map to list of maps completed
    notes[ogMapAbbr] = {
        PERSON: ogPerson,
        LINK: `[${ogLinkCell.value}](${ogLinkCell.hyperlink})`,
        OG: true,
    };
    // Add rest of maps found in notes
    return {
        ...notes,
        ...parseMapNotes(ogMapCell.note),
    };
}

function err(e) {
    // TODO: The errors being caught here aren't UserCommandErrors, more like ComboErrors
    if (e instanceof UserCommandError) {
        return new Discord.MessageEmbed()
            .setTitle(e.message)
            .setColor(paleblue);
    } else {
        throw e;
    }
}

// Displays a 2MPC completion on the specified map
async function display2MPAlt(tower, map) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    mapFormatted = gHelper.toTitleCase(map.split('_').join(' '));
    towerFormatted = gHelper.toTitleCase(tower.split('_').join(' '));

    entryRow = await rowFromTower(tower);

    // Load the map cell, the only cell that likely matters
    await sheet.loadCells(
        `${COLS.OG_MAP}${entryRow}:${COLS.OG_MAP}${entryRow}`
    );

    ogMapCell = sheet.getCellByA1(`${COLS.OG_MAP}${entryRow}`);
    ogMap = ogMapCell.value;

    // Display OG map as if map weren't in the query
    if (mapFormatted == ogMap) {
        return await display2MPOG(tower);
    }

    notes = parseMapNotes(ogMapCell.note);

    // Tower has been completed on queried map if the map abbreviation can be found in the notes
    if ((altCompletion = notes[Aliases.mapToIndexAbbreviation(map)])) {
        // Embed and send the message
        let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(`${towerFormatted} 2MPC Combo on ${mapFormatted}`)
            .setColor(paleblue)
            .addField('Person', altCompletion.PERSON, true)
            .addField('Link', altCompletion.LINK, true);
        
        return challengeEmbed;
    } else {
        throw new UserCommandError(
            `Tower \`${towerFormatted}\` has not yet been completed on \`${mapFormatted}\``
        );
    }
}

// Displays the OG 2MPC completion
async function display2MPOG(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    entryRow = await rowFromTower(tower);

    // Load the row where the map was found
    await sheet.loadCells(`${COLS.NUMBER}${entryRow}:${COLS.LINK}${entryRow}`);

    // Assign each value to be discord-embedded in a simple default way
    values = {};
    for (key in COLS) {
        values[key] = sheet.getCellByA1(`${COLS[key]}${entryRow}`).value;
    }

    // Special formatting for date (get formattedValue instead)
    dateCell = sheet.getCellByA1(`${COLS.DATE}${entryRow}`);
    values.DATE = dateCell.formattedValue;

    // Special handling for link (use hyperlink to cleverly embed in discord)
    linkCell = sheet.getCellByA1(`${COLS.LINK}${entryRow}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    // Embed and send the message
    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`${values.TOWER} 2MPC Combo`)
        .setColor(paleblue);

    for (field in values) {
        challengeEmbed.addField(
            gHelper.toTitleCase(field.replace('_', ' ')),
            values[field],
            true
        );
    }

    challengeEmbed.addField('OG?', 'OG', true);

    mapCell = sheet.getCellByA1(`${COLS.OG_MAP}${entryRow}`);
    altMaps = Object.keys(parseMapNotes(mapCell.note));
    ogMap = Aliases.mapToIndexAbbreviation(
        Aliases.toAliasNormalForm(values.OG_MAP)
    );

    mapGroups = [
        Aliases.beginnerMaps(),
        Aliases.intermediateMaps(),
        Aliases.advancedMaps(),
        Aliases.expertMaps(),
    ];
    if (Towers.isWaterTowerUpgrade(tower)) {
        mapGroups = mapGroups.map((aliases) =>
            aliases.filter((map) => Aliases.allWaterMaps().includes(map))
        );
    }
    mapGroups = mapGroups.map((aliases) =>
        aliases.map((alias) => Aliases.mapToIndexAbbreviation(alias))
    );

    altMapGroups = mapGroups.map((mapGroup) =>
        mapGroup.filter((map) => altMaps.includes(map))
    );
    unCompletedAltMapGroups = mapGroups.map((mapGroup) =>
        mapGroup.filter((map) => !altMaps.concat(ogMap).includes(map))
    );

    wordAllIncluded = false;

    displayedMapGroups = gHelper.range(0, altMapGroups.length - 1).map((i) => {
        mapDifficulty = ['BEG', 'INT', 'ADV', 'EXP'][i];
        waterTowerAsterisk = Towers.isWaterTowerUpgrade(tower) ? '*' : '';
        if (unCompletedAltMapGroups[i] == 0) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk}`;
        } else if (unCompletedAltMapGroups[i].length < 3) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk} - {${unCompletedAltMapGroups[
                i
            ].join(', ')}}`;
        } else if (altMapGroups[i].length == 0) {
            return '';
        } else {
            return `{${altMapGroups[i].join(', ')}}`;
        }
    });

    if (altMapGroups.some((group) => group.length > 0)) {
        altMapsString = '';
        altMapsString += `\n${displayedMapGroups[0]}`;
        altMapsString += `\n${displayedMapGroups[1]}`;
        altMapsString += `\n${displayedMapGroups[2]}`;
        altMapsString += `\n${displayedMapGroups[3]}`;
        challengeEmbed.addField('**Alt Maps**', altMapsString);
    } else {
        challengeEmbed.addField('**Alt Maps**', 'None');
    }

    if (Towers.isWaterTowerUpgrade(tower) && wordAllIncluded) {
        challengeEmbed.setFooter({ text: '*with water' });
    }

    return challengeEmbed;
}

// Gets the row of tower completion stats for the given tower
async function rowFromTower(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    [rowBegin, rowEnd] = await rowBoundaries();

    // Load the column containing the different maps
    await sheet.loadCells(`${COLS.TOWER}${rowBegin}:${COLS.TOWER}${rowEnd}`); // loads all possible cells with tower

    // The row where the queried map is found
    let entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = rowBegin; row <= rowEnd; row++) {
        let towerCandidate = sheet.getCellByA1(`${COLS.TOWER}${row}`).value;

        if (!towerCandidate) continue;

        // input is "in_the_loop" but needs to be compared to "In The Loop"
        if (
            Aliases.toIndexNormalForm(tower) ===
            gHelper.toTitleCase(towerCandidate)
        ) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw new UserCommandError(
            `Tower \`${Aliases.toIndexNormalForm(
                tower
            )}\` doesn't yet have a 2MP completion`
        );
    }

    return entryRow;
}

async function rowBoundaries() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');
    await sheet.loadCells(`${COLS.NUMBER}1:${COLS.NUMBER}${sheet.rowCount}`);

    startRow = null;
    endRow = null;

    for (let row = 1; row <= sheet.rowCount; row++) {
        numberCandidate = sheet.getCellByA1(`${COLS.NUMBER}${row}`).value;

        // If startRow has been found, find the first occurence of a blank cell
        if (startRow && !numberCandidate) {
            endRow = row - 1;
            break;
        } else if (
            numberCandidate &&
            numberCandidate.replace(/ /g, '') === '1st'
        ) {
            startRow = row;
        }
    }

    if (!startRow) {
        throw new DeveloperCommandError(
            `Orientation failed because \`1st\` couldn't be found in the "Number" column.`
        );
    }

    // If there wasn't a trailing blank cell, then the last cell viewed must be the end cell
    if (!endRow) endRow = sheet.rowCount;

    return [startRow, endRow];
}

// Parses the map notes by splitting on comma and colon to get the map+person+link
function parseMapNotes(notes) {
    if (!notes) return {};
    return Object.fromEntries(
        notes
            .trim()
            .split('\n')
            .map((n) => {
                let altmap, altperson, altbitly;
                [altmap, altperson, altbitly] = n
                    .split(/[,:]/)
                    .map((t) => t.replace(/ /g, ''));

                return [
                    altmap,
                    {
                        PERSON: altperson,
                        LINK: `[${altbitly}](http://${altbitly})`,
                    },
                ];
            })
    );
}

// Displays a 3x3 grid completion checkboxes/x'es for each upgrade+tier above base
// Also displays base
async function display2MPTowerStatistics(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    entryRow = await findTowerRow(tower);

    // Load the row where the map was found
    await sheet.loadCells(
        `${TOWER_COLS.TOWER}${entryRow}:${TOWER_COLS.LAST}${entryRow}`
    );

    // Check or X
    baseTowerCompletionMarking = await getCompletionMarking(entryRow, null, 2);

    const towerFormatted = Aliases.toIndexNormalForm(tower);

    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`2MPC Completions for ${towerFormatted}`)
        .setColor(paleblue)
        .addField('\u200b', '\u200b', true) // Left column placeholder
        .addField('Base Tower', baseTowerCompletionMarking, true) // Base tower
        .addField('\u200b', '\u200b', true); // Right column placeholder

    for (var tier = 3; tier <= 5; tier++) {
        for (var path = 1; path <= 3; path++) {
            towerUpgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(
                tower,
                path,
                tier
            );
            upgradeCompletionMarking = await getCompletionMarking(
                entryRow,
                path,
                tier
            );
            challengeEmbed.addField(
                towerUpgradeName,
                upgradeCompletionMarking,
                true
            );
        }
    }

    return challengeEmbed;
}

async function findTowerRow(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    // Load the column containing the different towers
    await sheet.loadCells(
        `${TOWER_COLS.TOWER}1:${TOWER_COLS.TOWER}${sheet.rowCount}`
    );

    entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= sheet.rowCount; row++) {
        let towerCandidate = sheet.getCellByA1(
            `${TOWER_COLS.TOWER}${row}`
        ).value;

        if (!towerCandidate) continue;

        if (Towers.towerUpgradeToIndexNormalForm(tower) == towerCandidate) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw new UserCommandError(
            `Tower \`${Aliases.toIndexNormalForm(
                tower
            )}\` doesn't yet have a 2MP completion`
        );
    }

    return entryRow;
}

// Converts the Index's marking of whether a tower's path/tier has been completed
// to symbols that are recognizable on the discord embed level
async function getCompletionMarking(entryRow, path, tier) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    upgradeCol = null;

    if (tier == 2) {
        upgradeCol = TOWER_COLS.BASE;
    } else {
        upgradeCol = String.fromCharCode(
            TOWER_COLS.BASE.charCodeAt(0) + (path - 1) * 3 + tier - 2
        );
    }

    completion = sheet.getCellByA1(`${upgradeCol}${entryRow}`).value.trim();

    if (completion == HEAVY_CHECK_MARK) {
        return WHITE_HEAVY_CHECK_MARK;
    } else {
        return RED_X;
    }
}

module.exports = {
    data: builder,
    execute,
}
