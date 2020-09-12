const Discord = require('discord.js');
const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const OrParser = require('../parser/or-parser.js');
const OptionalParser = require('../parser/optional-parser.js');

const MapParser = require('../parser/map-parser.js');
const NaturalNumberParser = require('../parser/natural-number-parser.js');
const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');
const AnyOrderParser = require('../parser/any-order-parser.js');

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
    CURRENT: 'P'
};

module.exports = {
    name: '2tc',
    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }''

        towerOrHeroParser = new OrParser(
            new TowerUpgradeParser(),
            new HeroParser(),
        ),

        parsers = [
            // Which 2TC's have been done on this map?
            new MapParser(), 
            // Get 2TC by combo number, optionally on the specified map
            new AnyOrderParser(
                new NaturalNumberParser(), 
                new OptionalParser(new MapParser())
            ),
            // Get 2TCs containing tower (optionally both towers), optionally on the specified map
            new AnyOrderParser(
                towerOrHeroParser,
                new OptionalParser(towerOrHeroParser),
                new OptionalParser(new MapParser())
            ),
        ];

        const parsed = CommandParser.parse(args, new OrParser(...parsers));

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        if (parsed.natural_number) { // Combo # provided
            if (parsed.map) { // and map specified
                return message.channel.send('Alt maps coming soon');
            } else { // and map NOT specified
                // OG completion
                displayOG2TC(message, parsed.natural_number).catch(
                    e => {
                        if(e instanceof UserCommandError)
                            return module.exports.errorMessage(message, [e.message])
                        else
                            throw e;
                    }
                );
            }
        } else if (parsed.hero || parsed.tower_upgrade) { // Tower(s) specified
            if (parsed.map) { // and map specified
                return message.channel.send('Alt maps coming soon');
            } else {
                if (parsed.heroes && parsed.heroes.length == 2) {
                    return message.channel.send(`Can't have a 2TC with 2 heroes`);
                }
                defenders = [].concat(parsed.heroes).concat(parsed.tower_upgrades).filter(d => d);
                
            }
        } else {
            return message.channel.send('Alt maps coming soon');
        }
    },

    helpMessage(message) {
        let helpEmbed = new Discord.MessageEmbed()
            .setTitle('`q!2tc` HELP')
            .addField('Example', '`q!2tc 44`');

        return message.channel.send(helpEmbed);
    },

    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .addField('Type `q!2tc` for help', ':)')
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};

async function displayOG2TC(message, n) {
    data = await getOG2TC(n);
    delete data.NUMBER;
    embed2TC(message, data, `2TC Combo #${n}`);
}

async function getOG2TC(n) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');

    row = n + await findOGRowOffset(sheet);

    await sheet.loadCells(`J6`);

    numCombos = sheet.getCellByA1('J6').value
    if (n > numCombos) {
        throw new UserCommandError(
            `You asked for the ${h.toOrdinalSuffix(n)} combo but there are only ${numCombos} listed.`
        );
    }

    await sheet.loadCells(`B${row}:P${row}`);

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
        values[`TOWER_${i + 1}`] += " (" + upgrades[i] + ")";
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

async function findOGRowOffset(sheet) {
    const MIN_OFFSET = 1;
    const MAX_OFFSET = 20;

    await sheet.loadCells(`B${MIN_OFFSET}:B${MAX_OFFSET}`);

    for (var row = MIN_OFFSET; row <= MAX_OFFSET; row++) {
        cellValue = sheet.getCellByA1(`B${row}`).value
        if(cellValue) {
            if (cellValue.toLowerCase().includes("number")) {
                return row;
            }
        }
    }

    throw `Cannot find 2TC header "Number" to orient combo searching`;
}

function embed2TC(message, values, title) {
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

    message.channel.send(challengeEmbed);
}