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

const UserCommandError = require('../exceptions/user-command-error.js');

const clonedeep = require('lodash.clonedeep');

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);

const gHelper = require('../helpers/general.js');

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

module.exports = {
    name: '2tc',
    execute,
    helpMessage,
    errorMessage,
    dependencies: ['btd6index'],
};

async function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return module.exports.helpMessage(message);
    }

    towerOrHeroParser = new OrParser(
        new HeroParser(),
        new TowerParser(),
        new TowerPathParser(),
        new TowerUpgradeParser()
    );

    parsers = [
        new OptionalParser(new OrParser(new MapParser(), new VersionParser())),
        new OptionalParser(
            new OrParser(new NaturalNumberParser(), towerOrHeroParser, [
                towerOrHeroParser,
                towerOrHeroParser,
            ])
        ),
        new OptionalParser(new PersonParser()),
    ];

    const parsed = CommandParser.parse(args, new AnyOrderParser(...parsers));

    if (parsed.hasErrors()) {
        return module.exports.errorMessage(message, parsed.parsingErrors);
    }

    try {
        allCombos = await scrapeAllCombos();

        filteredCombos = filterCombos(clonedeep(allCombos), parsed);

        displayCombos(message, filteredCombos, parsed, allCombos);
    } catch (e) {
        if (e instanceof UserCommandError) {
            message.channel.send(
                new Discord.MessageEmbed()
                    .setTitle(e.message)
                    .setColor(colours['orange'])
            );
        } else {
            throw e;
        }
    }
}

async function displayCombos(message, combos, parsed, allCombos) {
    if (combos.length == 0) {
        return message.channel.send(
            new Discord.MessageEmbed()
                .setTitle(`No combos found`)
                .setColor(colours['yellow'])
        );
    }

    if (combos.length == 1) {
        let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(embedTitle(parsed, combos))
            .setColor(colours['cyber']);
        
        flatCombo = flattenCombo(clonedeep(combos[0]));
        strippedCombo = stripCombo(clonedeep(flatCombo), parsed);
        combo = orderCombo(clonedeep(strippedCombo));

        for (field in combo) {
            challengeEmbed.addField(
                gHelper.toTitleCase(field),
                combo[field],
                true
            );
        }

        challengeEmbed.addField('OG?', flatCombo.OG ? 'OG' : 'ALT', true);

        if (flatCombo.OG && !(parsed.map || parsed.version || parsed.person)) {
            allCompletedMaps = Object.keys(allCombos.find(c => c.NUMBER === flatCombo.NUMBER).MAPS);
            altMaps = allCompletedMaps.filter(map => map != combo.MAP);
            altMaps = altMaps.map(properMapName => properMapName.split(' ').join('_').toLowerCase());
            altMaps = altMaps.map(properMapName => Aliases.mapToIndexAbbreviation(properMapName));

            mapGroups = [Aliases.beginnerMaps(), Aliases.intermediateMaps(), Aliases.advancedMaps(), Aliases.expertMaps()]
            mapGroups = mapGroups.map(aliases => aliases.map(alias => Aliases.mapToIndexAbbreviation(alias)));
            
            altMapGroups = mapGroups.map(mapGroup => mapGroup.filter(map => altMaps.includes(map)));

            if (altMapGroups.some(group => group.length > 0)) {
                altMapsString = ""
                altMapsString += `\n${altMapGroups[0].join(', ')}`;
                altMapsString += `\n${altMapGroups[1].join(', ')}`;
                altMapsString += `\n${altMapGroups[2].join(', ')}`;
                altMapsString += `\n${altMapGroups[3].join(', ')}`;
                challengeEmbed.addField(
                    "**Alt Maps**",
                    altMapsString
                )
            } else {
                challengeEmbed.addField("**Alt Maps**", "None");
            }
        }

        return message.channel.send(challengeEmbed);
    } else {
        fieldHeaders = getDisplayCols(parsed);

        colData = Object.fromEntries(
            fieldHeaders.map((fieldHeader) => {
                return [fieldHeader, []];
            })
        );

        for (var i = 0; i < combos.length; i++) {
            for (map in combos[i].MAPS) {
                combo = flattenCombo(clonedeep(combos[i]), map);

                for (
                    var colIndex = 0;
                    colIndex < fieldHeaders.length;
                    colIndex++
                ) {
                    fieldHeader = fieldHeaders[colIndex];

                    key = fieldHeader;

                    if (fieldHeader === 'UNSPECIFIED_TOWER') {
                        providedTower = parseProvidedDefinedTowers(parsed)[0];
                        towerNum = towerMatch(combos[i], providedTower);
                        otherTowerNum = 3 - towerNum;
                        key = `TOWER_${otherTowerNum}`;
                    }

                    colData[fieldHeader].push(combo[key]);
                }
            }
        }

        MAX_NUM_ROWS = 15;
        let maxNumRowsDisplayed = MAX_NUM_ROWS;

        // The number of rows to be displayed is variable depending on the characters in each link
        // Try 15 and decrement every time it doesn't work.
        for (
            maxNumRowsDisplayed = MAX_NUM_ROWS;
            maxNumRowsDisplayed > 0;
            maxNumRowsDisplayed--
        ) {
            let challengeEmbed = new Discord.MessageEmbed()
                .setTitle(embedTitle(parsed, combos))
                .setColor(colours['cyber']);

            numRows = colData[Object.keys(colData)[0]].length;

            challengeEmbed.addField(
                '# Combos',
                `**1**-**${Math.min(
                    maxNumRowsDisplayed,
                    numRows
                )}** of ${numRows}`
            );

            for (header in colData) {
                data =
                    numRows <= maxNumRowsDisplayed
                        ? colData[header]
                        : colData[header]
                              .slice(0, maxNumRowsDisplayed)
                              .concat('...');

                challengeEmbed.addField(
                    gHelper.toTitleCase(header.split('_').join(' ')),
                    data.join('\n'),
                    true
                );
            }

            if (numRows > maxNumRowsDisplayed)
                challengeEmbed.setFooter(
                    'Too many combos to display all at once'
                );

            try {
                return await message.channel.send(challengeEmbed);
            } catch (e) {} // Retry by decrementing maxNumRowsDisplayed
        }
    }
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
    wellDefinedTowers = []
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
    ordering = Object.keys(OG_COLS).filter((v) => v !== 'UPGRADES');
    newCombo = {};
    ordering.forEach((key) => {
        if (combo[key]) newCombo[key] = combo[key];
    });
    return newCombo;
}

function flattenCombo(combo, map) {
    if (!map) map = Object.keys(combo.MAPS)[0];
    subcombo = combo.MAPS[map];

    flattenedCombo = combo;

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
    sampleCombo = combos[0];
    multipleCombos =
        combos.length > 1 || Object.keys(combos[0].MAPS).length > 1;

    towers = parsedProvidedTowers(parsed);
    map = Object.keys(sampleCombo.MAPS)[0];

    title = '';
    if (parsed.natural_number) title += `${sampleCombo.NUMBER} Combo `;
    else title += multipleCombos ? 'All Combos ' : 'Only Combo ';
    if (parsed.person) title += `by ${sampleCombo.MAPS[map].PERSON} `;
    if (parsed.map) title += `on ${map} `;
    for (var i = 0; i < towers.length; i++) {
        tower = towers[i];
        if (i == 0) title += 'with ';
        else title += 'and ';
        title += `${Towers.formatTower(tower)} `;
    }
    if (parsed.version) title += `in v${parsed.version} `;
    return title.slice(0, title.length - 1);
}

function filterCombos(filteredCombos, parsed) {
    if (parsed.natural_number) {
        combo = filteredCombos[parsed.natural_number - 1];
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

        providedTowers = parsedProvidedTowers(parsed);

        filteredCombos = filteredCombos.filter((combo) => {
            towerNum = towerMatch(combo, providedTowers[0]);
            if (!providedTowers[1]) return towerNum != 0; // If only 1 tower-query, return true for the combo if there was a tower match

            otherTowerNum = towerMatch(combo, providedTowers[1]);
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
                    combo.VERSION.includes(`${parsed.version}.`)
                );
            }
        });
    }

    if (parsed.person) {
        function personFilter(_, completion) {
            return completion.PERSON.toLowerCase() == parsed.person;
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
    if (parsed.version || (!parsed.person && !parsed.map)) {
        function ogFilter(_, completion) {
            return completion.OG;
        }
        filteredCombos = filterByCompletion(ogFilter, filteredCombos);
    }
    return filteredCombos;
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
    for (var i = combos.length - 1; i >= 0; i--) {
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

function towerMatch(combo, tower) {
    comboTowers = [combo.TOWER_1, combo.TOWER_2];
    if (Towers.isTower(tower)) {
        return (
            comboTowers
                .map((t) => {
                    towerUpgrade = Aliases.toAliasNormalForm(t.NAME);
                    return Towers.towerUpgradeToTower(towerUpgrade);
                })
                .indexOf(tower) + 1
        );
    } else if (Towers.isTowerUpgrade(tower)) {
        return (
            comboTowers
                .map((t) => {
                    towerUpgrade = Aliases.toAliasNormalForm(t.NAME);
                    return Aliases.getCanonicalForm(towerUpgrade);
                })
                .indexOf(tower) + 1
        );
    } else if (Aliases.isHero(tower)) {
        return (
            comboTowers
                .map((t) => {
                    return t.NAME.toLowerCase();
                })
                .indexOf(tower) + 1
        );
    } else if (Towers.isTowerPath(tower)) {
        return (
            comboTowers
                .map((t) => {
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

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!2tc` HELP')
        .setDescription('**2TC Combo Finder**')
        .addField('`1`,`42`, `101`', 'Find the nth combo')
        .addField(
            '`u#case_insensitive_username`',
            'Search combos by username; replace all spaces with underscores; keep all symbols'
        )
        .addField('`wiz`, `spact`', 'Search combos by base tower name')
        .addField('`wiz#top`, `spact#bot`', 'Search combos by tower path')
        .addField(
            '`aspike`, `spact#005`',
            'Seach combos by upgrade; if you write out the upgrade itself, do not crosspath'
        )
        .addField('`obyn`, `eti`', 'Search combos by hero')
        .addField(
            '`logs`, `ck`, `moon-landing`',
            'Search combos by map completed on'
        )
        .addField('`v23`, `v10.2`', 'Limit results to version completed in')
        .addField(
            'Examples',
            '`q!calc r99 - wiz#025 - super#052` (2tc test)\n' +
                '`q!calc ninja#502 + ninja#030 * 20 * 0.85` (GMN + single-discounted shinobi army)'
        )
        .addField(
            'Notes',
            ' • You may include the above arguments in the `q!2tc` command in nearly any combination, except in ways outlined by the following rules:\n' +
                ' • You may only search a max of two tower-like arguments at a time. Searching for two towers finds combos with A _AND_ B, not A _OR_ B\n' +
                ' • For every other field listed, you may only search one per command. For example, searching two usernames will not work.\n' +
                " • You may not search version and map at the same time. This is because alt map completions don't specify version completed.\n" +
                ' • Including the version number will exclude alt map completions for the above reason.\n' +
                ' • There is currently no way to see all maps that a 2TC was completed on :/\n' +
                ' • There is currently no way to search by map difficulty, like `beginner` or `advanced`. Adding any more options slows the command down way too much.\n' +
                ' • There is currently no way to scroll through multi-page results. Just make the command more specific.\n'
        )
        .setColor(colours['black']);

    return message.channel.send(helpEmbed);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!2tc` for help', '\u200b')
        .setColor(colours['orange']);

    return message.channel.send(errorEmbed);
}

function sheet2TC() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');
}

async function scrapeAllCombos() {
    ogCombos = await scrapeAllOGCombos();
    altCombos = await scrapeAllAltCombos();
    return mergeCombos(ogCombos, altCombos);
}

function mergeCombos(ogCombos, altCombos) {
    mergedCombos = [];

    for (var i = 0; i < ogCombos.length; i++) {
        toBeMergedOgCombo = ogCombos[i];

        map = toBeMergedOgCombo.MAP;
        delete toBeMergedOgCombo.MAP; // Incorporated as key of outer Object within array index

        person = toBeMergedOgCombo.PERSON;
        delete toBeMergedOgCombo.PERSON; // Incorporated as key-value pair in comboObject

        link = toBeMergedOgCombo.LINK;
        delete toBeMergedOgCombo.LINK; // Incorporated as key-value pair in comboObject

        comboObject = {
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
        toBeMergedAltCombo = altCombos[i];

        n = gHelper.fromOrdinalSuffix(toBeMergedAltCombo.NUMBER);
        delete toBeMergedAltCombo.NUMBER;

        map = toBeMergedAltCombo.MAP;
        delete toBeMergedAltCombo.MAP;

        mergedCombos[n - 1].MAPS[map] = {
            ...toBeMergedAltCombo,
            OG: false,
        };
    }

    return mergedCombos;
}

async function scrapeAllOGCombos() {
    sheet = sheet2TC();
    nCombos = await numCombos();
    rOffset = await findOGRowOffset();

    ogCombos = [];

    await sheet.loadCells(
        `${OG_COLS.NUMBER}${rOffset + 1}:${OG_COLS.CURRENT}${rOffset + nCombos}`
    );

    for (var n = 1; n <= nCombos; n++) {
        row = rOffset + n;

        ogCombos.push(await getOG2TCFromPreloadedRow(row));
    }

    return ogCombos;
}

async function scrapeAllAltCombos() {
    sheet = sheet2TC();
    rOffset = await findOGRowOffset();

    await sheet.loadCells(
        `${ALT_COLS.NUMBER}${rOffset + 1}:${ALT_COLS.LINK}${sheet.rowCount}`
    );

    altCombos = [];

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
    if (values.CURRENT === HEAVY_CHECK_MARK) {
        values.CURRENT = WHITE_HEAVY_CHECK_MARK;
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
        cellValue = sheet.getCellByA1(`B${row}`).value;
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
