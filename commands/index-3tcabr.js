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
            return displayOG3TCABRFromN(message, parsed.natural_number);
        } else if (parsed.hero || parsed.tower_upgrade) { // Tower(s) specified
            return message.channel.send('Searching combos by towers coming soon');
        } else {
            return message.channel.send('Searching combos by person coming soon');
        }
    },

    helpMessage(message) {
        let helpEmbed = new Discord.MessageEmbed()
            .setTitle('`q!2tc` HELP')
            .addField(
                '`q!2tc <n>`', 
                'Get the nth combo on the OG map\n`q!2tc 44`'
            )
        
        return message.channel.send(helpEmbed);
    },         
};

function embed(message, values, title, footer) {
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
        challengeEmbed.setFooter(footer)
    }

    message.channel.send(challengeEmbed);
}

COMBOS_ROW_OFFSET = 11;
NUM_COMBOS_COUNTER = 'L6'

async function displayOG3TCABRFromN(message, n) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '3tc abr');

    await sheet.loadCells(`${NUM_COMBOS_COUNTER}:${NUM_COMBOS_COUNTER}`);

    NUM_COMBOS = parseInt(sheet.getCellByA1(NUM_COMBOS_COUNTER).value);
    if (n > NUM_COMBOS) {
        throw new UserCommandError(
            `You asked for the ${h.toOrdinalSuffix(n)} combo but there are only ${NUM_COMBOS} listed.`
        );
    }

    const row = n + COMBOS_ROW_OFFSET;

    await sheet.loadCells(`${OG_COLS.NUMBER}${row}:${OG_COLS.LINK}${row}`);

    // Assign each value to be discord-embedded in a simple default way
    let values = {};
    for (key in OG_COLS) {
        values[key] = sheet.getCellByA1(
            `${OG_COLS[key]}${row}`
        ).value;
    }

    delete values.NUMBER; // Display combo # in title
    
    const upgrades = values.UPGRADES.split('|').map(u => u.replace(/^\s+|\s+$/g, ''));
    for (var i = 0; i < upgrades.length; i++) {
        // Display upgrade next to tower
        values[`TOWER_${i + 1}`] += "\n(" + upgrades[i] + ")";
    }
    delete values.UPGRADES; // Don't display upgrades on their own, display with towers

    // Recapture date to format properly
    values.DATE = sheet.getCellByA1(`${OG_COLS.DATE}${row}`).formattedValue;

    // Recapture link to format properly
    const linkCell = sheet.getCellByA1(`${OG_COLS.LINK}${row}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    return embed(message, values, `3-Tower ABR CHIMPS Combo #${n}`)
}
