const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const EmptyParser = require('../parser/empty-parser.js');
const OrParser = require('../parser/or-parser.js');
const MapParser = require('../parser/map-parser.js');
const ExactStringParser = require('../parser/exact-string-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');

(MIN_ROW = 1),
    (MAX_ROW = 100),
    (COLS = {
        NUMBER: 'B',
        TOWER: 'C',
        UPGRADES: 'E',
        OG_MAP: 'F',
        VERSION: 'H',
        DATE: 'I',
        PERSON: 'J',
        LINK: 'L',
    });

module.exports = {
    name: '2mp',

    aliases: ['2m', '2mpc'],

    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

        const parsed = CommandParser.parse(
            args,
            new TowerUpgradeParser(),
            new OrParser(
                new EmptyParser(), // OG completion for tower
                new MapParser(), // Completion of tower on specified map
                new MapDifficultyParser(), // Completions of tower on maps under specified difficulty
                new ExactStringParser('ALL') // All completions for tower
            )
        );

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        async function display2MPOG(btd6_map) {
            const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'lcc');
            
            // Load the column containing the different maps
            await sheet.loadCells(
                `${COLS.MAP}${MIN_ROW}:${COLS.MAP}${MAX_ROW}`
            ); // loads all possible cells with map

            // The row where the queried map is found
            var entryRow = null;

            // Search for the row in all "possible" rows
            for (let row = 1; row <= MAX_ROW; row++) {
                var mapCandidate = sheet.getCellByA1(`${COLS.MAP}${row}`).value;
                // input is "in_the_loop" but needs to be compared to "In The Loop"
                if (
                    mapCandidate &&
                    mapCandidate.toLowerCase().replace(' ', '_') === btd6_map
                ) {
                    entryRow = row;
                    break;
                }
            }

            // Load the row where the map was found
            await sheet.loadCells(
                `${COLS.MAP}${entryRow}:${COLS.CURRENT}${entryRow}`
            );

            // Assign each value to be discord-embedded in a simple default way
            values = {};
            for (key in COLS) {
                values[key] = sheet.getCellByA1(
                    `${COLS[key]}${entryRow}`
                ).value;
            }

            // Special formatting for date (get formattedValue instead)
            dateCell = sheet.getCellByA1(`${COLS.DATE}${entryRow}`);
            values.DATE = dateCell.formattedValue;

            // Special formatting for cost (format like cost)
            values.COST = h.numberAsCost(values.COST);

            // Special handling for link (use hyperlink to cleverly embed in discord)
            linkCell = sheet.getCellByA1(`${COLS.LINK}${entryRow}`);
            values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

            // Embed and send the message
            var challengeEmbed = new Discord.MessageEmbed()
                .setTitle(`${values.MAP} LCC Combo`)
                .setColor(colours['cyber']);

            for (field in values) {
                challengeEmbed = challengeEmbed.addField(
                    h.toTitleCase(field),
                    values[field],
                    true
                );
            }

            message.channel.send(challengeEmbed);
        }

        console.log(parsed);

        // display2MPOG(btd6_map);
    },

    helpMessage(message) {
        let helpEmbed = new Discord.MessageEmbed()
            .setTitle('`q!lcc` HELP')
            .addField(
                '`q!lcc <map>`',
                'The BTD6 Index entry for Least Cash CHIMPS for the queried map'
            )
            .addField(
                'Valid `<map>` values',
                '`logs`, `cubism`, `pen`, `#ouch`, ...'
            )
            .addField('Example', '`q!lcc bloodles`');

        return message.channel.send(helpEmbed);
    },

    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .addField('Type `q!lcc` for help', ':)')
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};
