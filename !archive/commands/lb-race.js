const axios = require('axios');

const AnyOrderParser = require('../parser/any-order-parser.js');
const NaturalNumberParser = require('../parser/natural-number-parser.js');
const OptionalParser = require('../parser/optional-parser.js');
const PersonParser = require('../parser/person-parser');
const RaceParser = require('../parser/raceid-parser.js');

const race = require('../helpers/race');

const { red, cyber, green } = require('../jsons/colours.json');
const { discord } = require('../aliases/misc.json');

const Leaderboard = require('../helpers/race/leaderboard.js');

const raceImg =
    'https://static.wikia.nocookie.net/b__/images/4/40/EventRaceIcon.png/revision/latest/scale-to-width-down/340?cb=20200616225307&path-prefix=bloons';

let ids = require('../aliases/raceid.json');
const id = Object.keys(ids)[Object.keys(ids).length - 1];

module.exports = {
    name: 'raceleaderboard',
    aliases: ['leaderboard', 'lb'],
    casedArgs: true,
    async execute(message, args) {
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        let raceID = id;
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        if (args.length == 1 && args[0] === 'help') {
            return await module.exports.helpMessage(message);
        }

        const parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new OptionalParser(new RaceParser()),
                new OptionalParser(new PersonParser()),
                new OptionalParser(new NaturalNumberParser(1, 100)),
                new OptionalParser(new NaturalNumberParser(1, 100))
            )
        );

        if (parsed.hasErrors()) {
            return await this.errorMessage(message, parsed.parsingErrors);
        }
        if (parsed.race) raceID = parsed.race;

        let data;
        try {
            data = await race.getRaceJSON(raceID);
        } catch (e) {
            console.log(e);
            return await this.errorMessage(message, ['invalid race id']);
        }
        let lb = new Leaderboard(data);
        await lb.init();
        let identifiable = undefined;

        if (parsed.person) {
            identifiable = parsed.person;
        } else if (parsed.natural_numbers?.length == 1) {
            identifiable = parsed.natural_number;
        }
        if (identifiable) {
            let output = lb.getPlayer(identifiable); // works for username or position
            let embed = new Discord.EmbedBuilder()
                .setTitle(`ID: ${data.leaderboardID}`)
                .setURL(race.getRaceURL(raceID))
                .setDescription(output)

                .addFields([
                    {
                        name: 'Timestamps are known to be inaccurate for certain versions',
                        value: 'see [this video](https://youtu.be/IGE155tCmss)'
                    }
                ])
                .setColor(cyber)
                .setTimestamp()
                .setThumbnail(raceImg);
            return await message.channel.send({ embeds: [embed] });
        } else {
            let output = '';
            if (parsed.natural_numbers) output = lb.getWall(parsed.natural_numbers[0], parsed.natural_numbers[1]);
            else output = lb.getWall();
            if (output.length > 4096) {
                return await module.exports.errorMessage(message, ['too many characters']);
            }
            let embed = new Discord.EmbedBuilder()
                .setTitle(`ID: ${data.leaderboardID}`)
                .setURL(race.getRaceURL(raceID))
                .setDescription(output)

                .addFields([
                    {
                        name: 'Timestamps are known to be inaccurate for certain versions',
                        value: 'see [this video](https://youtu.be/IGE155tCmss)'
                    },
                    { name: 'Individual info', value: 'to see how to get individual (more detailed) stats use `q!lb help`' }
                ])
                .setFooter({ text: 'this is what everyone outside top 100 sees the leaderboard as (updated every 15 mins)' })
                .setColor(cyber)
                .setTimestamp()
                .setThumbnail(raceImg);
            await message.channel.send({ embeds: [embed] });
        }
    },
    async helpMessage(message) {
        let embed = new Discord.EmbedBuilder()
            .setTitle('`q!racelb` HELP')
            .setDescription('BTD6 Race leaderboard loader')
            .addFields([
                {
                    name: 'Example Usages',
                    values: `\`q!lb 1 50\` - shows lb from 1st place to 50th place
\`q!lb r#100\` - shows lb for given race number
\`q!lb yinandyang\` - shows lb for given race name (in this case yin and yang) **NOTE: Names MUST NOT have any spaces**
\`q!lb ${id}\` - shows lb for given race ID. For list of race IDs see <#846647839312445451> in [this server](${discord})
\`q!lb u#tsp\` - shows user placement`
                }
            ])

            .setFooter({
                text: 'this is what everyone outside top 100 sees the leaderboard as (updated every 15 mins), if you are in t100 the lb you see is more accurate'
            })
            .setColor(green);
        await message.channel.send({ embeds: [embed] });
    },
    async errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.EmbedBuilder()
            .setTitle('ERROR')
            .addFields([
                {
                    name: 'Example Usages',
                    values: `\`q!lb 1 50\` - shows lb from 1st place to 50th place
\`q!lb r#100\` - shows lb for given race number
\`q!lb yinandyang\` - shows lb for given race name (in this case yin and yang) **NOTE: Names MUST NOT have any spaces**
\`q!lb ${id}\` - shows lb for given race ID. For list of race IDs see <#846647839312445451> in [this server](${discord})
\`q!lb u#tsp\` - shows user placement`
                },
                { name: 'Likely Cause(s)', values: parsingErrors.map((msg) => ` • ${msg}`).join('\n') }
            ])
            .setColor(red);

        return await message.channel.send({ embeds: [errorEmbed] });
    }
};
