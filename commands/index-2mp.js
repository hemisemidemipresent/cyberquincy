const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const OrParser = require('../parser/or-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');

const EmptyParser = require('../parser/empty-parser.js');
const MapParser = require('../parser/map-parser.js');
const ExactStringParser = require('../parser/exact-string-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');

const COLS = {
    NUMBER: 'B',
    TOWER: 'C',
    UPGRADES: 'E',
    OG_MAP: 'F',
    VERSION: 'H',
    DATE: 'I',
    PERSON: 'J',
    LINK: 'L',
};

module.exports = {
    name: '2mp',

    aliases: ['2m', '2mpc'],

    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

        const parsed = CommandParser.parseAnyOrder(
            args,
            new OrParser(new TowerUpgradeParser(), new HeroParser()),
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

        async function display2MPOG(tower) {
            const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

            // Load the column containing the different maps
            await sheet.loadCells(
                `${COLS.TOWER}1:${COLS.TOWER}${sheet.rowCount}`
            ); // loads all possible cells with tower

            // The row where the queried map is found
            var entryRow = null;

            // Search for the row in all "possible" rows
            for (let row = 1; row <= sheet.rowCount; row++) {
                var towerCandidate = sheet.getCellByA1(`${COLS.TOWER}${row}`)
                    .value;
                // input is "in_the_loop" but needs to be compared to "In The Loop"
                if (
                    towerCandidate &&
                    towerCandidate.toLowerCase().split(' ').join('_') === tower
                ) {
                    entryRow = row;
                    break;
                }
            }

            if (!entryRow) {
                return message.channel.send(
                    `Tower \`${h.toTitleCase(
                        tower.split('_').join(' ')
                    )}\` doesn't yet have a 2MP completion`
                );
            }

            // Load the row where the map was found
            await sheet.loadCells(
                `${COLS.NUMBER}${entryRow}:${COLS.LINK}${entryRow}`
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

            // Special handling for link (use hyperlink to cleverly embed in discord)
            linkCell = sheet.getCellByA1(`${COLS.LINK}${entryRow}`);
            values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

            // Embed and send the message
            var challengeEmbed = new Discord.MessageEmbed()
                .setTitle(`${values.TOWER} 2MPC Combo`)
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

        if (parsed.map) {
            // TODO
            message.channel.send('Feature in progress');
        } else if (parsed.exact_string) {
            // TODO
            message.channel.send('Feature in progress');
        } else if (parsed.map_difficulty) {
            // TODO
            message.channel.send('Feature in progress');
        } else {
            let tower = null;
            if (parsed.tower_upgrade) {
                tower = Aliases.getAliasSet(parsed.tower_upgrade)[1];
            } else if (parsed.hero) {
                tower = parsed.hero;
            } else {
                throw `Somehow the \`q!2mp\` command parsed successfully without grabbing a hero or tower upgrade`;
            }

            display2MPOG(tower);
        }
    },

    helpMessage(message) {
        let helpEmbed = new Discord.MessageEmbed()
            .setTitle('`q!2mp` HELP')
            .addField(
                '`q!2mp <tower_upgrade>`',
                'The OG 2MP completion for the specified tower.\n' +
                    ' • Can either be `base_tower#\\d\\d\\d` (where \\d represents a digit).\n' +
                    'or an upgrade name like `sentry_paragon`. Cannot combine both.\n' +
                    ' • Upgrades must not include crosspathing.'
            )
            .addField(
                'Valid `<tower_upgrade>` values',
                '`pspike`, `spact#005`, `spike_factory#005`, `permaspike`, `perma-spike`, etc.'
            )
            .addField(
                'Invalid `<tower_upgrade>` values',
                'spact#025, permaspike#005'
            )
            .addField('Example', '`q!2mp gmn`');

        return message.channel.send(helpEmbed);
    },

    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .addField('Type `q!2mp` for help', ':)')
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};
