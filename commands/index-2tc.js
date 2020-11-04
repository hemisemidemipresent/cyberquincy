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
            new OrParser(
                towerOrHeroParser, // 1 tower
                [ // 2 towers
                    towerOrHeroParser,
                    towerOrHeroParser
                ],
                new NaturalNumberParser() // combo #
            ),
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

    allCombos = await scrapeAllCombos();

    if (parsed.natural_number) { // Combo #
        allCombos = [allCombos[parsed.natural_number - 1]] // Wrap single combo object in an array for consistency
    } else if (parsed.hero || parsed.tower_upgrade || parsed.tower || parsed.tower_path) {
        try {
            if (parsed.heroes && parsed.heroes.length > 1) {
                return message.channel.send(`Combo cannot have more than 1 hero (${parsed.heroes.join(" + ")})`)
            }

            providedTowers = [].concat(parsed.tower_upgrades)
                                    .concat(parsed.tower_paths)
                                    .concat(parsed.towers)
                                    .concat(parsed.heroes)
                                    .filter(el => el) // Remove null items
            
            allCombos = allCombos.filter(combo => {
                towerNum = towerMatch(combo, providedTowers[0])
                if (!providedTowers[1]) return towerNum != 0

                otherTowerNum = towerMatch(combo, providedTowers[1])
                return towerNum + otherTowerNum == 3 // Ensure that one tower matched to tower 1, other matched to tower 2
                // Note that failed matches return 0
            })
        } catch (e) {
            return err(e, message);
        }
    }
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
    } else if (Aliases.isTowerPath()) {
        return comboTowers.map(t => {
            upgradeArray = t.UPGRADE.split('-')
            pathIndex = upgradeArray.indexOf(Math.max(...upgradeArray))
            path = pathIndex == 0 ? "top" : pathIndex == 1 ? "middle" : "bottom"
            
            towerUpgrade = Aliases.toAliasNormalForm(t.NAME)
            towerBase = Aliases.towerUpgradeToTower(towerUpgrade)
            return `${towerBase}#${path}`
        }).indexOf(tower) + 1
    } else {
        throw `Somehow received tower that is not in any of [tower, tower_upgrade, tower_path, hero]`
    }
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!2tc` HELP')
        .addField(
            '`q!2tc <n>`',
            'Get the nth combo on the OG map\n`q!2tc 44`'
        )
        .addField(
            '`q!2tc <n> <map>`',
            'Get the nth combo on the specified map\n`q!2tc 44 frozen_over`'
        )
        .addField(
            '`q!2tc <tower_upgrade/hero> <tower_upgrade/hero>`',
            'Get a combo by the towers involved on the OG map\n`q!2tc obyn dch`'
        )
        .addField(
            '`q!2tc <tower_upgrade/hero> <tower_upgrade/hero> <map>`',
            'Get a combo by the towers involved on the specified map\n`q!2tc obyn dch cube`'
        );

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

function err(e, message) {
    if (e instanceof UserCommandError) {
        return module.exports.errorMessage(message, [e.message]);
    } else {
        throw e;
    }
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

        delete toBeMergedOgCombo.NUMBER // Incorporated as array index

        map = toBeMergedOgCombo.MAP
        delete toBeMergedOgCombo.MAP // Incorporated as key of outer Object within array index

        person = toBeMergedOgCombo.PERSON
        delete toBeMergedOgCombo.PERSON // Incorporated as key-value pair in comboObject

        link = toBeMergedOgCombo.LINK
        delete toBeMergedOgCombo.LINK // Incorporated as key-value pair in comboObject

        comboObject = {...toBeMergedOgCombo}
        comboObject[map] = {
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

        mergedCombos[n][map] = {
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

function normalizeTowers(tower_upgrades, heroes) {
    if (heroes && heroes.length == 2) {
        throw new UserCommandError(`Can't have a 2TC with 2 heroes`);
    }

    tower_upgrades = tower_upgrades
        ? tower_upgrades.map((tu) => Aliases.towerUpgradeToIndexNormalForm(tu))
        : [];
    heroes = heroes ? heroes.map((hr) => h.toTitleCase(hr)) : [];
    return heroes.concat(tower_upgrades);
}

async function numCombos() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');
    await sheet.loadCells(`J6`);
    return sheet.getCellByA1('J6').value;
}

function embed2TC(message, values, title, footer) {
    // Embed and send the message
    var challengeEmbed = new Discord.MessageEmbed()
        .setTitle(title)
        .setColor(colours['cyber']);

    for (field in values) {
        challengeEmbed = challengeEmbed.addField(
            h.toTitleCase(field.replace('_', ' ')),
            values[field],
            true
        );
    }

    if (footer) {
        challengeEmbed.setFooter(footer);
    }

    message.channel.send(challengeEmbed);
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

////////////////
// N
////////////////

async function displayOG2TCFromN(message, n) {
    row = await getOGRowFromN(n);
    data = await getOG2TCFromRow(row);
    delete data.NUMBER;
    embed2TC(message, data, `2TC Combo #${n}`);
}

async function getOGRowFromN(n) {
    nCombos = await numCombos();
    if (n > nCombos) {
        throw new UserCommandError(
            `You asked for the ${h.toOrdinalSuffix(
                n
            )} combo but there are only ${nCombos} listed.`
        );
    }

    return n + (await findOGRowOffset());
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

////////////////
// Towers
////////////////

async function displayOG2TCFromTowers(message, towers) {
    row = await getOGRowFromTowers(towers);
    data = await getOG2TCFromRow(row);

    // Recollect towers in tower# order and with upgrades
    towers = [data.TOWER_1, data.TOWER_2];

    // Don't include tower info in embedded, only in title
    delete data.TOWER_1;
    delete data.TOWER_2;

    embed2TC(message, data, `2TC Combo: ${towers.join(' + ')}`);
}

async function getOGRowFromTowers(towers) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');

    startRow = (await findOGRowOffset(sheet)) + 1;
    endRow = startRow + (await numCombos()) - 1;

    await sheet.loadCells(
        `${OG_COLS.TOWER_1}${startRow}:${OG_COLS.TOWER_2}${endRow}`
    );

    for (var row = startRow; row <= endRow; row++) {
        candidateTowers = [];
        candidateTowers.push(
            sheet.getCellByA1(`${OG_COLS.TOWER_1}${row}`).value
        );
        candidateTowers.push(
            sheet.getCellByA1(`${OG_COLS.TOWER_2}${row}`).value
        );

        if (
            h.arraysEqual(
                towers.map((t) => t.toLowerCase()),
                candidateTowers.map((t) => t.toLowerCase())
            )
        ) {
            return row;
        }
    }
    throw new UserCommandError(`${towers.join(' + ')} isn't a 2TC yet.`);
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

////////////////
// N
////////////////

async function displayAlt2TCFromN(message, n, map) {
    const ogRow = await getOGRowFromN(n);
    const og2TCData = await getOG2TCFromRow(ogRow);

    data = null;
    embedFooter = null;

    if (og2TCData.MAP == Aliases.toIndexNormalForm(map)) {
        data = og2TCData;
        embedFooter =
            'This is the OG map completion. Enter the same query without the map to see more info.';
    } else {
        const alt2TCData = await getAlt2TCFromNAndMap(parseInt(n), map);

        // Combine the data between OG and ALT, override shared data with the alt entry
        data = {
            ...og2TCData,
            ...alt2TCData,
        };
    }

    // Exclude irrelevant information from OG towers lookup and embed title
    delete data.NUMBER;
    delete data.MAP;
    delete data.VERSION;
    delete data.DATE;
    delete data.CURRENT;

    embed2TC(
        message,
        data,
        `2TC Combo #${n} on ${Aliases.toIndexNormalForm(map)}`,
        embedFooter
    );
}

////////////////
// Towers
////////////////

async function displayAlt2TCFromTowers(message, towers, map) {
    const ogRow = await getOGRowFromTowers(towers);
    const og2TCData = await getOG2TCFromRow(ogRow);

    data = null;
    embedFooter = null;

    // Stick with OG data if the map being queried is the OG map
    if (og2TCData.MAP == Aliases.toIndexNormalForm(map)) {
        data = og2TCData;
        embedFooter =
            'This is the OG map completion. Enter the same query without the map to see more info.';
    } else {
        // Otherwise, stick to the plan of parsing the alt maps table
        const alt2TCData = await getAlt2TCFromNAndMap(
            parseInt(og2TCData.NUMBER),
            map
        );

        // Combine the data between OG and ALT, override shared data with the alt entry
        data = {
            ...og2TCData,
            ...alt2TCData,
        };
    }

    // Recollect towers in tower# order and with upgrades
    towers = [data.TOWER_1, data.TOWER_2];

    // Exclude irrelevant information from OG towers lookup and embed title
    delete data.TOWER_1;
    delete data.TOWER_2;
    delete data.MAP;
    delete data.VERSION;
    delete data.DATE;
    delete data.CURRENT;
    data.NUMBER = data.NUMBER.replace('*', '');

    embed2TC(
        message,
        data,
        `2TC Combo on ${Aliases.toIndexNormalForm(map)}: ${towers.join(' + ')}`,
        embedFooter
    );
}