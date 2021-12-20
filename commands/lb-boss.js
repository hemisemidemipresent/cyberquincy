const axios = require('axios');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const NaturalNumberParser = require('../parser/natural-number-parser.js');
const OptionalParser = require('../parser/optional-parser.js');

const gHelper = require('../helpers/general.js');
const race = require('../helpers/race.js');

const { red, cyber, green, magenta } = require('../jsons/colours.json');
const { discord } = require('../aliases/misc.json');

const BossLeaderboard = require('../helpers/boss/leaderboard-boss.js');

let ids = require('../jsons/bossid.json');

module.exports = {
    name: 'bossleaderboard',
    aliases: ['bosslb', 'blb'],
    obj: { elite: false, type: 'SP' },
    async execute(message, args) {
        let bossID = ids[ids.length - 1];
        if (args.length == 1 && args[0] === 'help') {
            return await module.exports.helpMessage(message);
        }

        const parsed = CommandParser.parse(
            args,
            new OptionalParser(new NaturalNumberParser(1, ids.length))
        );
        if (parsed.hasErrors()) {
            return await this.errorMessage(message, parsed.parsingErrors);
        }
        const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('type')
                .setPlaceholder('Nothing selected')
                .addOptions([
                    {
                        label: 'SP',
                        description: 'Normal, Singleplayer',
                        value: '{"elite":false,"type":"SP"}',
                    },
                    {
                        label: '2P',
                        description: 'Normal, 2 players',
                        value: '{"elite":false,"type":"2P"}',
                    },
                    {
                        label: '3P',
                        description: 'Normal, 3 players',
                        value: '{"elite":false,"type":"3P"}',
                    },
                    {
                        label: '4P',
                        description: 'Normal, 4 players',
                        value: '{"elite":false,"type":"4P"}',
                    },
                    {
                        label: 'ESP',
                        description: 'Elite, Singleplayer',
                        value: '{"elite":true,"type":"SP"}',
                    },
                    {
                        label: 'E2P',
                        description: 'Elite, 2 players',
                        value: '{"elite":true,"type":"2P"}',
                    },
                    {
                        label: 'E3P',
                        description: 'Elite, 3 players',
                        value: '{"elite":true,"type":"3P"}',
                    },
                    {
                        label: 'E4P',
                        description: 'Elite, 4 players',
                        value: '{"elite":true,"type":"4P"}',
                    },
                ])
        );
        await message.reply({
            content: 'Select which leaderboard you want to see',
            components: [row],
        });
        const filter = (interaction) =>
            interaction.customId === 'type' &&
            interaction.user.id == message.author.id; //  nothing basically
        const collector = await message.channel.createMessageComponentCollector(
            {
                filter,
                time: 5000,
            }
        );
        collector.on('collect', async (i) => {
            let obj = JSON.parse(i.values[0]);
            collector.stop();
            await this.loadLB(parsed, obj, bossID, i);
        });
        collector.on('end', async (collected) => {
            if (!collected.first()) {
                let errorEmbed = new Discord.MessageEmbed()
                    .setTitle(`You took too long to select`)
                    .setColor(magenta);
                return await message.channel.send({ embeds: [errorEmbed] });
            }
        });
    },
    async helpMessage(message) {
        let embed = new Discord.MessageEmbed()
            .setTitle('`q!bosslb` HELP')
            .setDescription('BTD6 Boss leaderboard loader')
            .addField(
                'Example Usages',
                '`q!blb 1 50` - shows lb from 1st place to 50th place\n' +
                    `\`q!blb 5\` - shows lb for the 5th boss event\n`
            )

            .setFooter(
                'this is what everyone outside top 100 sees the leaderboard as (updated every 15 mins), if you are in t100 the lb you see is more accurate'
            )
            .setColor(green);
        await message.channel.send({ embeds: [embed] });
    },
    async errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Example Usages',
                '`q!blb 1 50` - shows lb from 1st place to 50th place\n' +
                    `\`q!blb 5\` - shows lb for the 5th boss event\n`
            )
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .setColor(red);

        return await message.channel.send({ embeds: [errorEmbed] });
    },
    async errorMessageI(interaction, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Example Usages',
                '`q!blb 1 50` - shows lb from 1st place to 50th place\n' +
                    `\`q!blb 5\` - shows lb for the 5th boss event\n`
            )
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .setColor(red);

        return await interaction.update({
            content: '\u200b',
            embeds: [errorEmbed],
            components: [],
        });
    },
    async loadLB(parsed, obj, bossID, interaction) {
        let data;
        try {
            data = await race.getBossJSON(bossID, obj);
        } catch (e) {
            console.error(e);
            return await this.errorMessageI(interaction, ['invalid boss id']);
        }

        let lb = new BossLeaderboard(data, obj);
        await lb.init();
        let output = '';
        if (parsed.natural_numbers)
            output = lb.getWall(
                parsed.natural_numbers[0],
                parsed.natural_numbers[1]
            );
        else output = lb.getWall();
        if (output.length > 4096) {
            return await module.exports.errorMessageI(interaction, [
                'too many characters',
            ]);
        }
        let embed = new Discord.MessageEmbed()
            .setTitle(`ID: ${data.leaderboardID}`)
            .setURL(race.getBossURL(bossID, obj))
            .setDescription('```' + output + '```')

            .setFooter(
                'this is what everyone outside top 100 sees the leaderboard as (updated every 15 mins)'
            )
            .setColor(cyber)
            .setTimestamp();
        await interaction.update({
            content: '\u200b',
            embeds: [embed],
            components: [],
        });
    },
};
