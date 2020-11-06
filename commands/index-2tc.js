const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const OrParser = require('../parser/or-parser.js');
const OptionalParser = require('../parser/optional-parser.js');
const AnyOrderParser = require('../parser/any-order-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const TowerPathParser = require('../parser/tower-path-parser')
const TowerParser = require('../parser/tower-parser')
const HeroParser = require('../parser/hero-parser.js');

const MapParser = require('../parser/map-parser.js');
const PersonParser = require('../parser/person-parser')

const NaturalNumberParser = require('../parser/natural-number-parser.js');
const VersionParser = require('../parser/version-parser')

const UserCommandError = require('../exceptions/user-command-error.js');

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);

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
    dependencies: ['btd6index']
};

async function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return module.exports.helpMessage(message);
    }

    towerOrHeroParser = new OrParser(
        new HeroParser(),
        new TowerParser(),
        new TowerPathParser(),
        new TowerUpgradeParser(),
    )

    parsers = [
        new OptionalParser(
            new MapParser()
        ),
        new OptionalParser(
            towerOrHeroParser
        ),
        new OptionalParser(
            towerOrHeroParser
        ),
        new OptionalParser(
            new NaturalNumberParser()
        ),
        new OptionalParser(
            new PersonParser()
        ),
        new OptionalParser(
            new VersionParser()
        )
    ];

    const parsed = CommandParser.parse(
        args,
        new AnyOrderParser(...parsers)
    );

    if (parsed.hasErrors()) {
        return module.exports.errorMessage(message, parsed.parsingErrors);
    }

    semanticErrors = checkSemanticErrors(parsed)

    allCombos = await scrapeAllCombos();
    
    filteredCombos = filterCombos(allCombos, parsed);

    displayCombos(message, filteredCombos, parsed);
}

function checkSemanticErrors(parsed) {
    errors = []

    parsedTowers = parsedProvidedTowers(parsed).map(t => formatTower(t))
    if (parsedTowers.length > 0 && parsed.natural_number) {
        twrs = parsedTowers.length > 1 ? 'towers' : 'tower'
        errors.push(
            `You searched for combo #${parsed.natural_number}, so ` +
            `it doesn't make sense to also search for ${twrs} ${parsedTowers.join(', ')}`)
    }

    if (parsed.version && parsed.number) {
        errors.push(`You searched for combo #${parsed.natural_number} but a version was needlessly specified (${parsed.version})`)
    }

    if (parsed.version && parsed.tower_upgrades.length == 2) {
        errors.push(`You searched for an exact combo containing ${parsedTowers.join(' & ')} but a version was needlessly specified (${parsed.version})`)
    }

    if (parsed.version && parsed.map) {
        errors.push(
            `You searched for all combos on ${Aliases.toIndexNormalForm(parsed.map)}` +
            `but you specified a version, which the index doesn't list for alt maps.`
        )
    }
}

function formatTower(tower) {
    if (Aliases.isTower(tower)) {
        return `${Aliases.towerUpgradeToIndexNormalForm(tower)} `
    } else if (Aliases.isTowerPath(tower)) {
        [towerName, path] = tower.split('#')
        return `${h.toTitleCase(path.split('-').join(' '))} ` +
                `${Aliases.towerUpgradeToIndexNormalForm(towerName)} `
    } else if(Aliases.isTowerUpgrade(tower)) {
        return `${Aliases.towerUpgradeToIndexNormalForm(tower)} `
    } else if (Aliases.isHero(tower)) {
        return `${h.toTitleCase(tower)} `
    } else {
        throw `tower ${tower} is not within allotted tower/hero category. Failed to build 2TC embed title`
    }
}

function displayCombos(message, combos, parsed) {
    console.log(combos);

    if (combos.length == 0) {
        return message.channel.send('No combos')
    }

    let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(embedTitle(parsed, combos[0]))
            .setColor(colours['cyber'])
    
    message.channel.send(challengeEmbed)

    if (combos.length == 1) {
        combo = flattenCombo(combos[0])
        combo = stripCombo(combo, parsed)
        combo = orderCombo(combo)
        
        for (field in combo) {
            challengeEmbed.addField(
                h.toTitleCase(field),
                combo[field],
                true
            )
        }
    } else {
        cols = getDisplayCols(parsed)
        for (var i = 0; i < combos.length; i++) {
            for (map in combo.MAPS) {
                combo = flattenCombo(combos[i], map)

                for (field in cols) {
                    if (field === 'OTHER_TOWER') {
                        providedTower = parsedProvidedTowers(parsed)[0]
                        towerNum = towerMatch(combos[i], providedTower)
                        field = `TOWER_${towerNum}`
                    }

                    challengeEmbed.addField(
                        h.toTitleCase(field),
                        combo[field],
                        true
                    )
                }
            }
        }
    }
    return message.channel.send(challengeEmbed)
}

function getDisplayCols(parsed) {
    if (parsed.person) {
        if (parsed.tower_upgrades.length == 2) {
            return ['NUMBER', 'MAP', 'LINK']
        } else if (parsed.tower_upgrades) {
            return ['OTHER_TOWER', 'MAP', 'LINK']
        } else if (parsed.MAP) {
            return ['TOWER_1', 'TOWER_2', 'LINK']
        } else {
            return ['TOWER_1', 'TOWER_2', 'MAP']
        }
    } else if (parsed.tower_upgrades.length == 2) {
        return ['NUMBER', 'PERSON', 'LINK']
    } else if (parsed.tower_upgrade) {
        return ['OTHER_TOWER', 'PERSON', 'LINK']
    } else if (parsed.version) {
        return ['NUMBER', 'TOWER_1', 'TOWER_2']
    } else {
        return ['TOWER_1', 'TOWER_2', 'LINK']
    }
}

function stripCombo(combo, parsed) {
    wellDefinedTowers = [].concat(parsed.tower_upgrades).concat(parsed.heroes).filter(el => el)

    if (parsed.natural_number) delete combo.NUMBER
    if (wellDefinedTowers.length == 2) {
        delete combo.TOWER_1
        delete combo.TOWER_2
    }
    if (parsed.version || !combo.OG) delete combo.VERSION
    if (parsed.map) delete combo.MAP
    if (parsed.person) delete combo.PERSON

    if (!combo.OG) delete combo.CURRENT
    if (!combo.OG) delete combo.DATE

    delete combo.OG

    return combo
}

function orderCombo(combo) {
    ordering = Object.keys(OG_COLS).filter(v => v !== 'UPGRADES')
    newCombo = {}
    ordering.forEach(key => {
        if(combo[key]) newCombo[key] = combo[key]
    })
    return newCombo
}

function flattenCombo(combo, map) {
    if(!map) map = Object.keys(combo.MAPS)[0]
    subcombo = combo.MAPS[map]

    combo.MAP = map
    combo.PERSON = subcombo.PERSON
    combo.LINK = subcombo.LINK
    combo.OG = subcombo.OG
    delete combo.MAPS

    for (var tn = 1; tn <= 2; tn++) {
        combo[`TOWER_${tn}`] = `**${combo[`TOWER_${tn}`].NAME}** (${combo[`TOWER_${tn}`].UPGRADE})`
    }

    return combo;
}

// include sampleCombo for the correct capitalization and punctuation
function embedTitle(parsed, sampleCombo) {
    towers = parsedProvidedTowers(parsed)
    map = Object.keys(sampleCombo.MAPS)[0]

    title = ""
    if (parsed.natural_number) title += `${sampleCombo.NUMBER} Combo `
    else title += 'All Combos '
    if (parsed.person) title += `by ${sampleCombo.MAPS[map].PERSON} `
    if (parsed.map) title += `on ${map} `
    for (var i = 0; i < towers.length; i++) {
        tower = towers[i]
        title += `${formatTower(tower)} `
        if (i == 0) title += 'with '
        else title += 'and '

    }
    if (parsed.version) title += `in v${parsed.version} `
    return title.slice(0, title.length - 1)
}

function filterCombos(filteredCombos, parsed) {
    if (parsed.natural_number) { 
        // Filter by combo # provided
        filteredCombos = [filteredCombos[parsed.natural_number - 1]] // Wrap single combo object in an array for consistency
    } else if (parsed.hero || parsed.tower_upgrade || parsed.tower || parsed.tower_path) {
        // Filter by towers/heroes provided
        if (parsed.heroes && parsed.heroes.length > 1) {
            return message.channel.send(`Combo cannot have more than 1 hero (${parsed.heroes.join(" + ")})`)
        }

        providedTowers = parsedProvidedTowers(parsed)
        
        filteredCombos = filteredCombos.filter(combo => {
            towerNum = towerMatch(combo, providedTowers[0])
            if (!providedTowers[1]) return towerNum != 0 // If only 1 tower-query, return true for the combo if there was a tower match

            otherTowerNum = towerMatch(combo, providedTowers[1])
            return towerNum + otherTowerNum == 3 // Ensure that one tower matched to tower 1, other matched to tower 2
            // Note that failed matches return 0
        })
    }

    if (parsed.version) {
        filteredCombos = filteredCombos.filter(combo => {
            if (parsed.version.includes('.')) {
                return parsed.version == combo.VERSION
            } else {
                return parsed.version == combo.VERSION || combo.VERSION.includes(`${parsed.version}.`)
            }
        })
    }

    if (parsed.person) {
        function personFilter(map, completion) {
            return completion.PERSON.toLowerCase() == parsed.person
        };
        filteredCombos = filterByCompletion(personFilter, filteredCombos)
    }

    if (parsed.map) {
        function mapFilter(map, completion) {
            return Aliases.toAliasNormalForm(map) == parsed.map
        }
        filteredCombos = filterByCompletion(mapFilter, filteredCombos)
    }

    // Unless searching by map or person, the command user wants OG completions and not alt map spam
    if (parsed.version || (!parsed.person && !parsed.map)) { 
        function ogFilter(map, completion) {
            return completion.OG
        }
        filteredCombos = filterByCompletion(ogFilter, filteredCombos)
    }
    return filteredCombos;
}

function parsedProvidedTowers(parsed) {
    return [].concat(parsed.tower_upgrades)
                .concat(parsed.tower_paths)
                .concat(parsed.towers)
                .concat(parsed.heroes)
                .filter(el => el) // Remove null items
}

function filterByCompletion(filter, combos) {
    for (var i = combos.length - 1; i >= 0; i--) {
        combos[i].MAPS = Object.keys(combos[i].MAPS)
            .filter(map => filter(map, combos[i].MAPS[map]))
            .reduce((completion, map) => {
                completion[map] = combos[i].MAPS[map];
                return completion;
            }, {});

        if (Object.keys(combos[i].MAPS).length === 0) combos.splice(i, 1)
    }
    return combos;
}

function towerMatch(combo, tower) {
    comboTowers = [combo.TOWER_1, combo.TOWER_2]
    if (Aliases.isTower(tower)) {
        return comboTowers.map(t => {
            towerUpgrade = Aliases.toAliasNormalForm(t.NAME)
            return Aliases.towerUpgradeToTower(towerUpgrade)
        }).indexOf(tower) + 1
    } else if(Aliases.isTowerUpgrade(tower)) {
        return comboTowers.map(t => {
            towerUpgrade = Aliases.toAliasNormalForm(t.NAME)
            return Aliases.getCanonicalForm(towerUpgrade)
        }).indexOf(tower) + 1
    } else if (Aliases.isHero(tower)) {
        return comboTowers.map(t => {
            return t.NAME.toLowerCase()
        }).indexOf(tower) + 1
    } else if (Aliases.isTowerPath(tower)) {
        return comboTowers.map(t => {
            upgradeArray = t.UPGRADE.split('-').map(u => parseInt(u))
            pathIndex = upgradeArray.indexOf(Math.max(...upgradeArray))
            path = pathIndex == 0 ? "top" : pathIndex == 1 ? "middle" : "bottom"
            
            towerUpgrade = Aliases.toAliasNormalForm(t.NAME)
            towerBase = Aliases.towerUpgradeToTower(towerUpgrade)
            return `${towerBase}#${path}-path`
        }).indexOf(tower) + 1
    } else {
        throw `Somehow received tower that is not in any of [tower, tower_upgrade, tower_path, hero]`
    }
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!2tc` HELP')

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
    ogCombos = await scrapeAllOGCombos()
    altCombos = await scrapeAllAltCombos()
    return mergeCombos(ogCombos, altCombos)
}

function mergeCombos(ogCombos, altCombos) {
    mergedCombos = []

    for (var i = 0; i < ogCombos.length; i++) {
        toBeMergedOgCombo = ogCombos[i]

        map = toBeMergedOgCombo.MAP
        delete toBeMergedOgCombo.MAP // Incorporated as key of outer Object within array index

        person = toBeMergedOgCombo.PERSON
        delete toBeMergedOgCombo.PERSON // Incorporated as key-value pair in comboObject

        link = toBeMergedOgCombo.LINK
        delete toBeMergedOgCombo.LINK // Incorporated as key-value pair in comboObject

        comboObject = {
            ...toBeMergedOgCombo,
            MAPS: {},
        }
        comboObject.MAPS[map] = {
            PERSON: person,
            LINK: link,
            OG: true
        }

        mergedCombos.push(
            comboObject
        )
    }

    for (var i = 0; i < altCombos.length; i++) {
        toBeMergedAltCombo = altCombos[i]

        n = h.fromOrdinalSuffix(toBeMergedAltCombo.NUMBER)
        delete toBeMergedAltCombo.NUMBER

        map = toBeMergedAltCombo.MAP
        delete toBeMergedAltCombo.MAP

        mergedCombos[n - 1].MAPS[map] = {
            ...toBeMergedAltCombo,
            OG: false
        }
    }

    return mergedCombos
}

async function scrapeAllOGCombos() {
    sheet = sheet2TC();
    nCombos = await numCombos();
    rOffset = await findOGRowOffset();

    ogCombos = []

    await sheet.loadCells(`${OG_COLS.NUMBER}${rOffset + 1}:${OG_COLS.CURRENT}${rOffset + nCombos}`);

    for (var n = 1; n <= nCombos; n++) {
        row = rOffset + n

        ogCombos.push(
            await getOG2TCFromPreloadedRow(row)
        )
    }

    return ogCombos;
}

async function scrapeAllAltCombos() {
    sheet = sheet2TC();
    rOffset = await findOGRowOffset();

    await sheet.loadCells(
        `${ALT_COLS.NUMBER}${rOffset + 1}:${ALT_COLS.LINK}${sheet.rowCount}`
    );

    altCombos = []

    for (var row = rOffset + 1; row <= sheet.rowCount; row++) {
        if (await hasGonePastLastAlt2TCCombo(row)) break;

        altCombos.push(
            await getAlt2TCFromPreloadedRow(row)
        )
    }

    return altCombos;
}

async function numCombos() {
    const sheet = sheet2TC()
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
        }
    }
    delete values.UPGRADES; // Don't display upgrades on their own, display with towers

    // Recapture date to format properly
    values.DATE = sheet.getCellByA1(`${OG_COLS.DATE}${row}`).formattedValue;

    // Recapture link to format properly
    const linkCell = sheet.getCellByA1(`${OG_COLS.LINK}${row}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

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