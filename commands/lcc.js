const MapParser = require('../parser/map-parser.js');
const GoogleSheetsHelper = require('../helpers/google-sheets.js');

(MIN_ROW = 1),
    (MAX_ROW = 100),
    (COLS = {
        MAP: 'B',
        COST: 'D',
        VERSION: 'E',
        DATE: 'F',
        PERSON: 'G',
        LINK: 'I',
        CURRENT: 'J',
    });

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);

module.exports = {
    name: 'lcc',

    aliases: ['leastcash', 'lcash'],

    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

        try{
            var btd6_map = CommandParser.parse(args,new MapParser()).map;
        } catch(e) {
            if (e instanceof ParsingError) {
                return module.exports.errorMessage(message, e);
            } else {
                throw e;
            }
        }

        async function displayLCC(btd6_map) {
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

            // Special handling for current
            // (heavy checkmark doesn't format, use white heavy checkmark instead)
            if (values.CURRENT === HEAVY_CHECK_MARK) {
                values.CURRENT = WHITE_HEAVY_CHECK_MARK;
            }

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

        displayLCC(btd6_map);
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

    errorMessage(message, parsingError) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Likely Cause(s)',
                parsingError.parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .addField('Type `q!lcc` for help', ':)')
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};
