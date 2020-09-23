const MapParser = require('../parser/map-parser.js');
const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const MIN_ROW = 1;
const MAX_ROW = 100;

const COLS = {
    TWO: {
        MAP: 'B',
        TOWERS: ['D', 'F'],
        UPGRADES: 'H',
        VERSION: 'J',
        DATE: 'K',
        PERSON: 'L',
        LINK: 'N',
        CURRENT: 'O',
    },
    THREE: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H'],
        UPGRADES: 'J',
        VERSION: 'L',
        DATE: 'M',
        PERSON: 'N',
        LINK: 'P',
        CURRENT: 'Q',
    },
    FOUR: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H', 'J'],
        UPGRADES: 'L',
        VERSION: 'O',
        DATE: 'P',
        PERSON: 'Q',
        LINK: 'S',
        CURRENT: 'T',
    },
    FIVE: {
        MAP: 'B',
        TOWERS: ['D', 'F', 'H', 'J', 'L'],
        UPGRADES: 'N',
        VERSION: 'Q',
        DATE: 'R',
        PERSON: 'S',
        LINK: 'U',
        CURRENT: 'V',
    },
    'SIX+': {
        MAP: 'B',
        AMOUNT: 'D',
        VERSION: 'E',
        DATE: 'F',
        PERSON: 'G',
        LINK: 'I',
        CURRENT: 'J',
    },
};

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);

module.exports = {
    name: 'ltc',

    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

        const parsed = CommandParser.parse(args, new MapParser());

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        var btd6_map = parsed.map;

        async function displayLTC(btd6_map) {
            const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'ltc');

            // Load the column containing the different maps
            await sheet.loadCells(
                `${COLS['TWO'].MAP}${MIN_ROW}:${COLS['TWO'].MAP}${MAX_ROW}`
            ); // loads all possible cells with map

            // The row where the queried map is found
            var entryRow = null;

            // Search for the row in all "possible" rows
            for (let row = 1; row <= MAX_ROW; row++) {
                var mapCandidate = sheet.getCellByA1(`${COLS['TWO'].MAP}${row}`)
                    .value;
                // input is "in_the_loop" but needs to be compared to "In The Loop"
                if (
                    mapCandidate &&
                    mapCandidate.toLowerCase().replace(/ /g, '_') === btd6_map
                ) {
                    entryRow = row;
                    break;
                }
            }

            // Determines correspondence between column letter and data type depending on
            // how many towers it took to complete the LTC run
            colset = getColumnSet(entryRow, sheet);

            // Load the row where the map was found
            await sheet.loadCells(
                `${colset.MAP}${entryRow}:${colset.CURRENT}${entryRow}`
            );

            // Values to be included in the LTC embedded message
            values = {};

            // Towers + Upgrades need some special handling since #towers varies
            if (colset['TOWERS']) {
                const upgrades = sheet
                    .getCellByA1(`${colset['UPGRADES']}${entryRow}`)
                    .value.split('|')
                    .map((u) => u.replace(/^\s+|\s+$/g, ''));

                for (var i = 0; i < colset['TOWERS'].length; i++) {
                    values[`Tower ${i + 1}`] =
                        sheet.getCellByA1(
                            `**${colset['TOWERS'][i]}${entryRow}**`
                        ).value +
                        ' (' +
                        upgrades[i] +
                        ')';
                }
            }

            // Assign each value to be discord-embedded in a simple default way
            for (key in colset) {
                if (key == 'TOWERS' || key == 'UPGRADES') continue; // Handle next
                values[key] = sheet.getCellByA1(
                    `${colset[key]}${entryRow}`
                ).value;
            }

            // Special formatting for date (get formattedValue instead)
            dateCell = sheet.getCellByA1(`${colset.DATE}${entryRow}`);
            values.DATE = dateCell.formattedValue;

            // Special handling for link (use hyperlink to cleverly embed in discord)
            linkCell = sheet.getCellByA1(`${colset.LINK}${entryRow}`);
            values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

            // Special handling for current
            // (heavy checkmark doesn't format, use white heavy checkmark instead)
            if (values.CURRENT === HEAVY_CHECK_MARK) {
                values.CURRENT = WHITE_HEAVY_CHECK_MARK;
            }

            // Embed and send the message
            var challengeEmbed = new Discord.MessageEmbed()
                .setTitle(`${values.MAP} LTC Combo`)
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

        displayLTC(btd6_map);
    },

    helpMessage(message) {
        let helpEmbed = new Discord.MessageEmbed()
            .setTitle('`q!ltc` HELP')
            .addField(
                '`q!ltc <map>`',
                'The BTD6 Index entry for Least Tower CHIMPS for the queried map'
            )
            .addField(
                'Valid `<map>` values',
                '`logs`, `cubism`, `pen`, `#ouch`, ...'
            )
            .addField('Example', '`q!ltc cuddles`');

        return message.channel.send(helpEmbed);
    },

    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .addField('Type `q!ltc` for help', '\u200b')
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};

function getColumnSet(mapRow, sheet) {
    // Looks for "Two|Three|...|Six+ Towers" in the closest above header cell
    headerRegex = new RegExp(
        `(${Object.keys(COLS).join('|').replace('+', '\\+')}) Towers`,
        'i'
    );

    candidateHeaderRow = mapRow - 1;
    while (true) {
        // Check cell to see if it's a header indicating the number of towers
        let candidateHeaderCell = sheet.getCellByA1(
            `${COLS['TWO'].MAP}${candidateHeaderRow}`
        );

        // Header rows take up 2 rows. If you check the bottom row, the data value is null.
        if (candidateHeaderCell.value) {
            const match = candidateHeaderCell.value.match(headerRegex);

            // Get the column set from the number of towers string in the header cell
            if (match) {
                return COLS[match[1].toUpperCase()];
            }
        }
        // If the header cell wasn't found, go up a row and try again.
        candidateHeaderRow -= 1;
    }
}
