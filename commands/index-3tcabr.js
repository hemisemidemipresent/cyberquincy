const Discord = require('discord.js');
const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const AnyOrderParser = require('../parser/any-order-parser');
const OptionalParser = require('../parser/optional-parser');
const OrParser = require('../parser/or-parser');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');
const NaturalNumberParser = require('../parser/natural-number-parser');
const PersonParser = require('../parser/person-parser.js');

const UserCommandError = require('../exceptions/user-command-error.js');

const OG_COLS = {
    NUMBER: 'B',
    TOWER_1: 'C',
    TOWER_2: 'E',
    TOWER_3: 'G',
    UPGRADES: 'I',
    MAP: 'K',
    VERSION: 'M',
    DATE: 'N',
    PERSON: 'O',
    LINK: 'Q',
};

module.exports = {
    name: '3tcabr',

    aliases: ['3tabrc', '3tabr', '3tcalt', '3talt'],

    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

        towerOrHeroParser = new OrParser(
            new TowerUpgradeParser(),
            new HeroParser(),
        )

        const parsed = CommandParser.parse(
            args, 
            new AnyOrderParser(
                new OrParser(
                    [
                        new NaturalNumberParser()
                    ],
                    [
                        towerOrHeroParser,
                        new OptionalParser(towerOrHeroParser),
                        new OptionalParser(towerOrHeroParser),
                    ],
                    [
                        new PersonParser()
                    ]
                ),
            )
        );

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        if (parsed.natural_number) { // Combo # provided
            return displayOG3TCABRFromN(message, parsed.natural_number).catch(e => err(e, message));
        } else if (parsed.hero || parsed.tower_upgrade) { // Tower(s) specified
            towers = null;
            try { towers = normalizeTowers(parsed.tower_upgrades, parsed.heroes) }
            catch(e) { return err(e, message) }

            return displayOG3TCABRFromSubsetTowers(message, towers).catch(e => err(e, message));
        } else {
            return message.channel.send('Searching combos by person coming soon');
        }
    },

    helpMessage(message) {
        let helpEmbed = new Discord.MessageEmbed()
            .setTitle('`q!3tcabr` HELP')
            .addField(
                '`q!3tcabr <n>`', 
                'Get the nth combo on the OG map\n`q!3tcabr 441`'
            )
            .addField(
                '`q!3tcabr <tower> {tower} {tower}`', 
                'Get all combos containing 1-3 entered towers\n`q!3tcabr wlp obyn mb`'
            )
        
        return message.channel.send(helpEmbed);
    },
    
    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .addField('Type `q!3tcabr` for help', ':)')
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};

function err(e, message) {
    if (e instanceof UserCommandError) {
        return module.exports.errorMessage(message, [e.message]);
    } else {
        throw e;
    }
}

function normalizeTowers(tower_upgrades, heroes) {
    if (heroes && heroes.length >= 2) {
        throw new UserCommandError(`Can't have a completion with more than 1 hero`);
    }

    // wizard#400 => arcane_spike => Arcane Spike
    tower_upgrades = tower_upgrades ? 
                        tower_upgrades.map(
                            tu => Aliases.towerUpgradeToIndexNormalForm(tu)
                        ) : []
    
    // obyn => Obyn
    heroes = heroes ? heroes.map(hr => h.toTitleCase(hr)) : [];
    return heroes.concat(tower_upgrades);
}

function embed(message, values, title, footer=null) {
    // Embed and send the message
    var challengeEmbed = new Discord.MessageEmbed()
        .setTitle(title)
        .setColor(colours['cyber']);
    
    // Format embed so towers come first
    towers = []
    towers.push(values.TOWER_1)
    towers.push(values.TOWER_2)
    towers.push(values.TOWER_3)

    delete values.TOWER_1
    delete values.TOWER_2
    delete values.TOWER_3
    
    // Embed towers
    for (var i = 0; i < towers.length; i++) {
        challengeEmbed = challengeEmbed.addField(
            `Tower ${i + 1}`,
            towers[i],
            true
        );
    }

    // Embed the rest of the fields
    for (field in values) {
        challengeEmbed = challengeEmbed.addField(
            h.toTitleCase(field.replace('_', ' ')),
            values[field],
            true
        );
    }

    if (footer) {
        challengeEmbed.setFooter(footer)
    }

    message.channel.send(challengeEmbed);
}

MAX_VALUES_LIST_LENGTH = 20;

function embedMultiple(message, valuesList, towers, title, footer=null) {
    if (valuesList.length > MAX_VALUES_LIST_LENGTH) {
        return embedPages(message, valuesList, towers, title);
    }

    challengeEmbed = multipleEmbedded(valuesList, towers, valuesList.length, title);

    message.channel.send(challengeEmbed);
}

function embedPages(message, valuesList, towers, title) {
    valuesChunks = h.chunk(valuesList, MAX_VALUES_LIST_LENGTH);
    numPages = valuesChunks.length;
    pg = 0;

    REACTIONS = ['⬅️', '➡️', '❌']
    function reactLoop(msg) {
        for (var i = 0; i < REACTIONS.length; i++) {
            msg.react(REACTIONS[i]);
        }

        msg.createReactionCollector((reaction, user) => 
            user.id === message.author.id && REACTIONS.includes(reaction.emoji.name),
            {time: 20000}
        ).once('collect', reaction => {
            switch(reaction.emoji.name) {
                case '⬅️':
                    pg--;
                    break;
                case '➡️':
                    pg++;
                    break;
                case '❌':
                default:
                    return msg.delete();
            }
            pg += numPages; // Avoid negative numbers
            pg %= numPages;
            displayCurrentPage();
        });
    }

    function displayCurrentPage() {
        challengeEmbed = multipleEmbedded(valuesChunks[pg], towers, valuesList.length, title, `${pg+1}/${numPages}`);
        message.channel.send(challengeEmbed).then(msg => reactLoop(msg));
    }

    displayCurrentPage();
}

function multipleEmbedded(valuesList, towers, numCombos, title, footer=null) {
    var challengeEmbed = new Discord.MessageEmbed()
        .setTitle(title)
        .setColor(colours['cyber']);
    
    const towersDisplayStrings = getTowersDisplayStrings(valuesList, towers);

    challengeEmbed = challengeEmbed.addField('#Combos', numCombos);

    for (var i = 0; i < towersDisplayStrings.length; i++) {
        challengeEmbed = challengeEmbed.addField(
            `Tower ${i + 1}`,
            towersDisplayStrings[i],
            true
        );
    }
    
    if (footer) {
        challengeEmbed.setFooter(footer)
    }

    return challengeEmbed;
}

// Take a list of tower-triplets and format them in such a way that there
// are 3 columns; Tower 1, Tower 2, and Tower 3.
//
// [t1, t2, t3], [t4, t5, t6], [t7, t8, t9]
//    goes to
//       Tower 1   Tower 2   Tower 3
//       t1        t2        t3
//       t4        t5        t6
//       t7        t8        t9
function getTowersDisplayStrings(valuesList, towers) {
    towersList = valuesList.map(v => [v.TOWER_1, v.TOWER_2, v.TOWER_3])

    
    return h.zip(towersList)
            .map(l => {
                return l.map(t => towers.map(t => t.toLowerCase()).includes(t.toLowerCase()) ? `**${t}**` : t)
                    .join("\n")
            });
}

async function numCombos() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '3tc abr');

    // The number of combos is listed in L6
    NUM_COMBOS_COUNTER = 'L6'

    await sheet.loadCells(`${NUM_COMBOS_COUNTER}:${NUM_COMBOS_COUNTER}`);

    return parseInt(sheet.getCellByA1(NUM_COMBOS_COUNTER).value);
}

async function findOGRowOffset() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '3tc abr');

    const MIN_OFFSET = 1;
    const MAX_OFFSET = 20;

    await sheet.loadCells(`${OG_COLS.NUMBER}${MIN_OFFSET}:${OG_COLS.NUMBER}${MAX_OFFSET}`);

    // Search through a few cells to ensure that row headers are where we expect them to be
    for (var row = MIN_OFFSET; row <= MAX_OFFSET; row++) {
        cellValue = sheet.getCellByA1(`B${row}`).value
        if(cellValue) {
            if (cellValue.toLowerCase().includes("number")) {
                return row;
            }
        }
    }

    throw `Cannot find 3TC ABR header "Number" to orient combo searching`;
}

async function displayOG3TCABRFromN(message, n) {
    values = await getOG3TCABRFromN(n);

    delete values.NUMBER; // Display combo # in title rather than embedded values

    return embed(message, values, `3-Tower ABR CHIMPS Combo #${n}`)
}

async function getOG3TCABRFromN(n) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '3tc abr');

    NUM_COMBOS = await numCombos();
    
    if (n > NUM_COMBOS) {
        throw new UserCommandError(
            `You asked for the ${h.toOrdinalSuffix(n)} combo but there are only ${NUM_COMBOS} listed.`
        );
    }

    const row = n + await findOGRowOffset();

    await sheet.loadCells(`${OG_COLS.NUMBER}${row}:${OG_COLS.LINK}${row}`);

    return await extractRow(row);
}

async function extractRow(row) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '3tc abr');

    // Assign each value to be discord-embedded in a simple default way
    let values = {};
    for (key in OG_COLS) {
        values[key] = sheet.getCellByA1(
            `${OG_COLS[key]}${row}`
        ).value;
    }
    
    const upgrades = values.UPGRADES.split('|').map(u => u.replace(/^\s+|\s+$/g, ''));
    for (var i = 0; i < upgrades.length; i++) {
        // Display upgrade next to tower
        values[`TOWER_${i + 1}`] = `**${values[`TOWER_${i + 1}`]}**` + " (" + upgrades[i] + ")";
    }
    delete values.UPGRADES; // Don't display upgrades on their own, display with towers

    // Recapture date to format properly
    values.DATE = sheet.getCellByA1(`${OG_COLS.DATE}${row}`).formattedValue;

    // Recapture link to format properly
    const linkCell = sheet.getCellByA1(`${OG_COLS.LINK}${row}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    return values;
}

async function displayOG3TCABRFromSubsetTowers(message, towers) {
    combos = await succCombos();
    // Filter all all 3-Tower ABR CHIMPS combos by ones that contain the command-user-specified towers
    const matchingCombos = combos.filter(c => {
        const comboTowers = [c.TOWER_1, c.TOWER_2, c.TOWER_3].map(t => t.toLowerCase());
        return towers.every(t => comboTowers.includes(t.toLowerCase()));
    });
    
    if (matchingCombos.length == 0) {
        throw new UserCommandError(`There is no 3-Tower ABR CHIMPS with ${towers.join(' + ')}`)
    } else if (matchingCombos.length == 1) {
        // Re-gather the data so it's properly formatted and displayed
        return displayOG3TCABRFromTowers(message, towers, matchingCombos[0]);
    } else {
        return embedMultiple(message, matchingCombos, towers, `3-Tower ABR CHIMPS with ${towers.join(' and ')}`);
    }
}

async function displayOG3TCABRFromTowers(message, towers, combo) {
    // 3rd => 3; 231st => 231; etc.
    n = parseInt(combo.NUMBER.match(/(\d+).*/)[1]);

    values = await getOG3TCABRFromN(n);

    // Order towers in completion order
    titleTowers = [combo.TOWER_1, combo.TOWER_2, combo.TOWER_3]
    titleTowers = titleTowers.filter(tt => towers.includes(tt))

    return embed(message, values, `3-Tower ABR CHIMPS Combo with ${titleTowers.join(' + ')}`)
}

async function succCombos() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '3tc abr');

    const NUM_COMBOS = await numCombos();
    
    const START_ROW = await findOGRowOffset() + 1;
    const END_ROW = START_ROW + NUM_COMBOS - 1;

    await sheet.loadCells(`${OG_COLS.NUMBER}${START_ROW}:${OG_COLS.LINK}${END_ROW}`);

    // Read the data from all rows one at a time and combine into a list
    let valuesList = []
    for (var row = START_ROW; row <= END_ROW; row++) {
        values = {}
        for (key in OG_COLS) {
            values[key] = sheet.getCellByA1(
                `${OG_COLS[key]}${row}`
            ).value;
        }
        valuesList.push(values);
    }
    return valuesList;
}
