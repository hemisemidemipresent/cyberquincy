const Discord = require('discord.js');
const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const OrParser = require('../parser/or-parser.js');
const OptionalParser = require('../parser/optional-parser.js');

const MapParser = require('../parser/map-parser.js');
const NaturalNumberParser = require('../parser/natural-number-parser.js');
const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');
const AnyOrderParser = require('../parser/any-order-parser.js');

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);

module.exports = {
    name: '2tc',
    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

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

        console.log(parsed);

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        return;

        async function display2TC(n) {
            const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2tc');
            
            await sheet.loadCells(`C${n + 11}:P${n + 11}`); // loads a range of cells
            const tower1 = sheet.getCellByA1(`C${n + 11}`).value;
            const tower2 = sheet.getCellByA1(`E${n + 11}`).value;
            const upgrades = sheet.getCellByA1(`G${n + 11}`).value.split('|').map(u => u.replace(/^\s+|\s+$/g, ''));
            const map = sheet.getCellByA1(`I${n + 11}`).value;
            const ver = sheet.getCellByA1(`K${n + 11}`).value;
            const date = sheet.getCellByA1(`L${n + 11}`).formattedValue;
            const person = sheet.getCellByA1(`M${n + 11}`).value;

            const linkCell = sheet.getCellByA1(`O${n + 11}`);
            const link = `[${linkCell.value}](${linkCell.hyperlink})`;

            var current = sheet.getCellByA1(`P${n + 11}`).value;
            if (current === HEAVY_CHECK_MARK) {
                current = WHITE_HEAVY_CHECK_MARK;
            }

            const challengeEmbed = new Discord.MessageEmbed()
                .setTitle(`2TC Combo #${n}`)
                .addField('Tower 1', `**${tower1}** (${upgrades[0]})`, true)
                .addField('Tower 2', `**${tower2}** (${upgrades[1]})`, true)
                .addField('Map', `**${map}**`, true)
                .addField('Version', `${ver}`, true)
                .addField('Date', `${date}`, true)
                .addField('Person', `**${person}**`, true)
                .addField('Link', `${link}`)
                .addField('Current?', `${current}`)
                .setColor(colours['cyber']);
            message.channel.send(challengeEmbed);
            if (isNaN(args[0]))
                return message.channel.send(
                    'Please specify a proper 2 towers chimps combo **number**'
                );
        }
        display2TC(parseInt(args[0]));
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
