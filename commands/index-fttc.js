const MapParser = require('../parser/map-parser');
const AnyOrderParser = require('../parser/any-order-parser');
const OrParser = require('../parser/or-parser');
const OptionalParser = require('../parser/optional-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
const PersonParser = require('../parser/person-parser');
const TowerParser = require('../parser/tower-parser');
const GoogleSheetsHelper = require('../helpers/google-sheets');

const gHelper = require('../helpers/general.js');

const { orange, paleorange } = require('../jsons/colours.json');

const SHEET_NAME = 'Empty';

const COLS = {
    ONE: {
        MAP: 'B',
        TOWERS: ['D'],
        VERSION: 'E',
        DATE: 'F',
        PERSON: 'G',
        LINK: 'I',
        CURRENT: 'J',
    },
    TWO: {
        MAP: 'B',
        TOWERS: ['D', 'E'],
        VERSION: 'F',
        DATE: 'G',
        PERSON: 'H',
        LINK: 'J',
        CURRENT: 'K',
    },
    THREE: {
        MAP: 'B',
        TOWERS: ['D', 'E', 'F'],
        VERSION: 'G',
        DATE: 'H',
        PERSON: 'I',
        LINK: 'K',
        CURRENT: 'L',
    },
    FOUR: {
        MAP: 'B',
        TOWERS: ['D', 'E', 'F', 'G'],
        VERSION: 'H',
        DATE: 'I',
        PERSON: 'J',
        LINK: 'L',
        CURRENT: 'M',
    },
    FIVE: {
        MAP: 'B',
        TOWERS: ['D', 'E', 'F', 'G', 'H'],
        VERSION: 'I',
        DATE: 'J',
        PERSON: 'K',
        LINK: 'M',
        CURRENT: 'N',
    },
    'SIX+': {
        MAP: 'B',
        '#': 'D',
        TOWERS: 'E',
        VERSION: 'J',
        DATE: 'K',
        PERSON: 'L',
        LINK: 'N',
        CURRENT: 'O',
    } 
};

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);

module.exports = {
    name: 'fttc',
    dependencies: ['btd6index'],

    execute,
    helpMessage,
    errorMessage,
};

async function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return helpMessage(message);
    }

    const parsed = CommandParser.parse(
        args,
        new AnyOrderParser(
            new OptionalParser(
                new OrParser(
                    new MapParser(),
                    new NaturalNumberParser()
                )
            ),
            new OptionalParser(new PersonParser()),
            // Search up to 2 towers at a time
            new OptionalParser(new TowerParser()),
            new OptionalParser(new TowerParser()),  
        )
    );

    if (parsed.towers && parsed.towers.length > parsed.natural_number) {
        parsed.addError(`You searched more towers (${parsed.towers.length}) than the number of towers you specified (${parsed.natural_number})`);
    }

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors);
    }

    let allResults = await parseFTTC();
    let filteredResults = filterResults(allResults, parsed);
    if (filteredResults.length == 0) {
        const noCombosEmbed = new Discord.MessageEmbed()
            .setTitle(titleNoCombos(parsed))
            .setColor(paleorange)
                                
        return message.channel.send(noCombosEmbed);
    } else {
        displayOneOrMultiplePages(message, parsed, filteredResults);
    }
    return true;
}

const TOWER_ABBREVIATIONS = {
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
}

async function parseFTTC() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, SHEET_NAME);

    await sheet.loadCells(
        `${COLS['SIX+'].MAP}${1}:${COLS['SIX+'].CURRENT}${sheet.rowCount}`
    );

    let colset;
    let combos = [];

    // Search for the row in all "possible" rows
    for (let row = 1; row <= sheet.rowCount; row++) {
        parsedHeader = sectionHeader(row, sheet);
        if (parsedHeader) {
            colset = COLS[parsedHeader]
            row += 2;
            continue;
        }
        if (!colset) continue;
        
        var mapCandidate = sheet.getCellByA1(`${colset.MAP}${row}`).value;
        if (!mapCandidate) continue;
        
        combos = combos.concat(await getRowData(row, colset))
    }

    return combos;
}

async function getRowData(entryRow, colset) {
    return [].concat(
        await getRowStandardData(entryRow, colset)
    ).concat(
        await getRowAltData(entryRow, colset)
    ).filter(e => e);
}

async function getRowStandardData(entryRow, colset) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, SHEET_NAME);
    let values = {TOWERS: []}

    // Six+
    if (Object.keys(colset).includes('#')) {
        values.TOWERS = sheet
            .getCellByA1(`**${colset['TOWERS']}${entryRow}**`)
            .value.split(",").map(tower => {
                return Aliases.getCanonicalForm(tower.trim())
            })
    } else {
        for (var i = 0; i < colset['TOWERS'].length; i++) {
            values.TOWERS.push(
                Aliases.getCanonicalForm(
                    sheet.getCellByA1(`**${colset['TOWERS'][i]}${entryRow}**`).value
                )
            );
        }
    }

    for (key in colset) {
        if (key == 'TOWERS') continue;
        values[key] = sheet.getCellByA1(`${colset[key]}${entryRow}`).value;
    }

    // Special formatting for date (get formattedValue instead)
    dateCell = sheet.getCellByA1(`${colset.DATE}${entryRow}`);
    values.DATE = dateCell.formattedValue;

    // Special handling for link (use hyperlink to cleverly embed in discord)
    linkCell = sheet.getCellByA1(`${colset.LINK}${entryRow}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    values.OG = true;

    // Special handling for current
    // (heavy checkmark doesn't format, use white heavy checkmark instead)
    if (values.CURRENT === HEAVY_CHECK_MARK) {
        values.CURRENT = WHITE_HEAVY_CHECK_MARK;
    }

    return values;
}

async function getRowAltData(entryRow, colset) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, SHEET_NAME);
    mapCell = sheet.getCellByA1(`${colset.MAP}${entryRow}`);

    notes = mapCell.note
    if (!notes) return null;

    return notes
            .trim()
            .split('\n')
            .map((entry) => {
                let towers, person, bitly;
                [towers, person, bitly] = entry
                    .split('|')
                    .map((t) => t.replace(/ /g, ''));
                
                return {
                    TOWERS: towers.split(',').map(t => Aliases.getCanonicalForm(t.trim())),
                    PERSON: person,
                    LINK: `[${bitly}](http://${bitly})`,
                    MAP: mapCell.value,
                    OG: false,
                };
            })
}

function sectionHeader(mapRow, sheet) {
    // Looks for "One|Two|...|Five|Six+ Towers"
    headerRegex = new RegExp(
        `(${Object.keys(COLS).join('|').replace('+', '\\+')}) Tower Types?`,
        'i'
    );

    // Check cell to see if it's a header indicating the number of towers
    let candidateHeaderCell = sheet.getCellByA1(
        `${COLS['ONE'].MAP}${mapRow}`
    );

    // Header rows take up 2 rows. If you check the bottom row, the data value is null.
    if (candidateHeaderCell.value) {
        const match = candidateHeaderCell.value.match(headerRegex);

        // Get the column set from the number of towers string in the header cell
        if (match) {
            return match[1].toUpperCase();
        }
    }
}

function filterResults(allCombos, parsed) {
    results = allCombos

     if (parsed.map) {
         results = results.filter(combo => Aliases.toAliasNormalForm(combo.MAP) == parsed.map)
     } else if (parsed.natural_number) {
        results = results.filter(combo => combo.TOWERS.length === parsed.natural_number)
    }

    if (parsed.person) {
        results = results.filter(combo => combo.PERSON.toLowerCase().split(' ').join('_') === parsed.person)
    }

    if (parsed.towers) {
        results = results.filter(combo => parsed.towers.every(specifiedTower => combo.TOWERS.includes(specifiedTower)))
    }

    if (shouldExcludeOG(parsed)) {
        results = results.filter(combo => combo.OG)
    }

    return results;
}

function shouldExcludeOG(parsed) {
    return parsed.natural_number && !parsed.person
}

async function displayOneOrMultiplePages(userQueryMessage, parsed, combos) {
    // Setup / Data consolidation
    let displayCols = ['TOWERS', 'MAP', 'PERSON', 'LINK']

    if (parsed.person) {
        displayCols = displayCols.filter(col => col != 'PERSON')
    }

    if (parsed.map) {
        displayCols = displayCols.filter(col => col != 'MAP')
    }
    
    if (displayCols.length === 4) {
        displayCols = displayCols.filter(col => col != 'PERSON')
    }

    const displayValues = displayCols.map(col => {
        if (col == 'TOWERS') {
            const boldedAbbreviatedTowers = combos.map(combo => combo[col].map(tower => {
                const towerCanonical = Aliases.getCanonicalForm(tower);
                const towerAbbreviation = TOWER_ABBREVIATIONS[towerCanonical].toUpperCase()
                return parsed.towers && parsed.towers.includes(towerCanonical) ? 
                    `**${towerAbbreviation}**` : 
                    towerAbbreviation;
            }))
            return boldedAbbreviatedTowers.map((comboTowers, i) => {
                let value = comboTowers.join(" | ")
                if (combos[i].OG && !shouldExcludeOG(parsed) && !parsed.towers) {
                    value = `**${value}**`
                }
                return value;
            })
        } else {
            return combos.map(combo => {
                value = combo[col]
                if (combo.OG && !shouldExcludeOG(parsed)) {
                    value = `**${value}**`
                }
                return value;
            })
        }
    })

    const numOGCompletions = combos.filter(combo => combo.OG).length;


    // Begin React-Loop
    REACTIONS = ['⬅️', '➡️'];
    MAX_NUM_ROWS = 15;
    const numRows = combos.length;
    let leftIndex = 0;
    let rightIndex = Math.min(MAX_NUM_ROWS, numRows) - 1;

    async function displayPages(direction = 1) {
        // The number of rows to be displayed is variable depending on the characters in each link
        // Try 15 and decrement every time it doesn't work.
        for (
            maxNumRowsDisplayed = MAX_NUM_ROWS;
            maxNumRowsDisplayed > 0;
            maxNumRowsDisplayed--
        ) {
            let challengeEmbed = new Discord.MessageEmbed()
                .setTitle(title(parsed, combos))
                .setColor(paleorange)

            challengeEmbed.addField(
                '# Combos',
                `**${leftIndex+1}**-**${rightIndex+1}** of ${numRows}`
            );

            for (var c = 0; c < displayCols.length; c++) {
                challengeEmbed.addField(
                    gHelper.toTitleCase(displayCols[c]),
                    displayValues[c].slice(leftIndex, rightIndex + 1).join('\n'),
                    true
                )
            }

            if (shouldExcludeOG(parsed)) {
                challengeEmbed.setFooter(`---\nNon-OG completions excluded`)
            } else {
                if (numOGCompletions == 1) {
                    challengeEmbed.setFooter(`---\nOG completion bolded`);
                }
                if (numOGCompletions > 1) {
                    challengeEmbed.setFooter(`---\n${numOGCompletions} OG completions bolded`);
                }
            }

            try {
                let msg = await userQueryMessage.channel.send(challengeEmbed);
                if (maxNumRowsDisplayed < numRows) {
                    return reactLoop(msg);
                }
                return msg;
            } catch (e) {} // Retry by decrementing maxNumRowsDisplayed

            if (direction > 0) rightIndex--;
            if (direction < 0) leftIndex++;
        }
    }

    // Gets the reaction to the pagination message by the command author
    // and respond by turning the page in the correction direction
    function reactLoop(botMessage) {
        // Lays out predefined reactions
        for (var i = 0; i < REACTIONS.length; i++) {
            botMessage.react(REACTIONS[i]);
        }
    
        // Read author reaction (time limit specified below in milliseconds)
        // and respond with appropriate action
        botMessage.createReactionCollector(
            (reaction, user) =>
                user.id === userQueryMessage.author.id &&
                REACTIONS.includes(reaction.emoji.name),
            { time: 20000 }
        ).once('collect', (reaction) => {
            switch (reaction.emoji.name) {
                case '⬅️':
                    rightIndex = (leftIndex - 1 + numRows) % numRows;
                    leftIndex = rightIndex - (MAX_NUM_ROWS - 1);
                    if (leftIndex < 0) leftIndex = 0;
                    displayPages(-1);
                    break;
                case '➡️':
                    leftIndex = (rightIndex + 1) % numRows;
                    rightIndex = leftIndex + (MAX_NUM_ROWS - 1);
                    if (rightIndex >= numRows) rightIndex = numRows - 1;
                    displayPages(1);
                    break;
            }
        });
    }
    displayPages(1)
}

function title(parsed, combos) {
    t = combos.length > 1 ? 'All FTTC Combos ' : 'Only FTTC Combo '
    if (parsed.person) t += `by ${combos[0].PERSON} `;
    if (parsed.natural_number) t += `with ${parsed.natural_number} towers `
    if (parsed.map) t += `on ${combos[0].MAP} `
    if (parsed.towers) t += `including ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[0])} `
    if (parsed.towers && parsed.towers[1]) t += `and ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[1])} `
    return t.slice(0, t.length - 1);
}

function titleNoCombos(parsed) {
    t = 'No FTTC Combos Found '
    if (parsed.person) t += `by "${parsed.person}" `;
    if (parsed.natural_number) t += `with ${parsed.natural_number} towers `
    if (parsed.map) t += `on ${Aliases.toIndexNormalForm(parsed.map)} `
    if (parsed.towers) t += `including ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[0])} `
    if (parsed.towers && parsed.towers[1]) t += `and ${Towers.towerUpgradeToIndexNormalForm(parsed.towers[1])} `
    return t.slice(0, t.length - 1);
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!fttc` HELP — The BTD6 Index Fewest Tower Type CHIMPS')
        .addField(
            '`q!fttc <map>`',
            'All FTTCs for the queried map' + 
                '\n`q!fttc frozenover`'
        )
        .addField(
            '`q!fttc <n>`',
            'All FTTCs with _n_ towers' +
                '\n`q!fttc 3`'
        )
        .addField(
            '`q!fttc <tower_1> {tower_2}`',
            'All FTTCs with (all) specified tower(s)' +
                '\n`q!fttc ace ninja`'
        )
        .addField(
            '`q!fttc <person>`',
            'All FTTCs by a given person' +
                '\n`q!fttc u#usernamegoeshere`'
        )
        .addField(
            'Notes',
            ' • You can combine query fields in any combination, except you may only search `<n>` OR `<map>` in a given command\n' +
            ' • Towers are abbreviated so they should fit in the column even if there are 5\n'
        )

        .setColor(paleorange);

    return message.channel.send(helpEmbed);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('Input Error')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!fttc` for help', '\u200b')
        .setColor(orange);

    return message.channel.send(errorEmbed);
}
