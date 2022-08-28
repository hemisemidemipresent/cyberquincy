const nodefetch = require('node-fetch');
const nksku = require('nksku');
const appID = 11;
const skuID = 35;
const { sessionID, UserAgent } = require('../1/config.json'); // getting the session ID is kinda sus
const deviceID = null;
const { ActionRowBuilder, ComponentType, SelectMenuBuilder, SlashCommandBuilder } = require('discord.js');

const { getUsernames } = require('../helpers/usernames');

const { blue } = require('../jsons/colours.json');
const { CTPointsIcon } = require('../jsons/emojis.json')['614111055890612225'].misc;

const eventID = 'l76rtr72';

builder = new SlashCommandBuilder()
    .setName('ct')
    .setDescription('Contested Territory statistics')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('guild_stats')
            .setDescription("Get your guild's statistics")
            .addStringOption((option) =>
                option.setName('guild_name').setDescription('The name of your guild').setRequired(true)
            )
    );

async function execute(interaction) {
    if (interaction.options.getSubcommand() === 'guild_stats') await guild_stats(interaction);
}

async function guild_stats(interaction) {
    const guildName = interaction.options.getString('guild_name');
    let body = { searchQuery: `*${guildName}* AND NOT status:DISBANDED AND numMembers>0`, limit: 20, offset: 0 };
    let nonce = Math.random() * Math.pow(2, 63) + '';
    let bodyString = JSON.stringify(body);
    let sig = nksku.signonce.sign(body, nonce, sessionID);

    try {
        let k = await nodefetch('https://api.ninjakiwi.com/guild/search', {
            method: 'POST',
            body: JSON.stringify({
                data: bodyString,
                auth: {
                    session: sessionID,
                    appID: appID,
                    skuID: skuID,
                    device: deviceID
                },
                sig,
                nonce: nonce
            }),
            headers: {
                'User-Agent': UserAgent,
                'Content-Type': 'application/json'
            }
        });

        let json = await k.json();
        let data = JSON.parse(json.data);
        let guilds = data.guilds;

        if (guilds.length === 0)
            return await interaction.reply({ content: `No guilds found with name ${guildName}`, ephemeral: true });
        if (guilds.length === 1) {
            try {
                let embed = await showRank(guilds[0], interaction);
                return await interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.log(e);
                return await interaction.reply({
                    content: 'Something went wrong while getting the guild statistics',
                    ephemeral: true
                });
            }
        }

        let actionrow = new ActionRowBuilder().addComponents(createSelector(guilds));

        await interaction.reply({ content: 'Please select your guild', components: [actionrow] });

        const filter = (selection) => {
            // Ensure user clicking button is same as the user that started the interaction
            if (selection.user.id !== interaction.user.id) return false;
            // Ensure that the button press corresponds with this interaction and wasn't a button press on the previous interaction
            if (selection.message.interaction.id !== interaction.id) return false;
            return true;
        };

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: ComponentType.SelectMenu,
            time: 20000
        });

        collector.on('collect', async (i) => {
            collector.stop();
            i.deferUpdate();

            let embed = await showRank(guilds[i.values[0]]);
            return await interaction.editReply({ content: '', embeds: [embed], components: [] });
        });

        collector.on('end', async (collected) => {
            if (collected.size === 0)
                await interaction.editReply({
                    content: 'You did not select a guild in time!',
                    embeds: [],
                    components: [],
                    ephemeral: true
                });
        });
    } catch (error) {
        console.log(error);
        await interaction.reply({ content: 'Something went wrong while searching for your guild', ephemeral: true });
    }
}

function createSelector(guilds) {
    let options = [];
    guilds.forEach((guild, index) => {
        options.push({
            label: guild.name,
            description: `members: ${guild.numMembers}/${guild.maximumMembers}`,
            value: index.toString()
        });
    });
    return new SelectMenuBuilder().setCustomId('guildSelector').setPlaceholder('Nothing selected').addOptions(options);
}

module.exports = {
    data: builder,
    execute
};

async function showRank(guild) {
    let ranks = await getRank(guild.guildID);
    let ranksData = JSON.parse(ranks.data).ranks[0];

    if (!ranksData)
        return new Discord.EmbedBuilder()
            .setTitle(guild.name)
            .setDescription('There was an issue getting the ranks')
            .setFooter({ text: `guild ID: ${guild.guildID}` });

    console.log(ranks);
    ranksData.rank += 1;
    guild.lastUpdated = Math.round(guild.lastUpdated / 1000); // the timestamp is in milliseconds, we want to convert to seconds

    const [owner] = await getUsernames([guild.owner]);

    const percent = (ranksData.rank / ranksData.total) * 100;

    const desc =
        `rank: **#${ranksData.rank} out of ${ranksData.total}** (top ${percent.toPrecision(2)}%)\n` +
        `score: **${ranksData.score}**${CTPointsIcon}\n` +
        `owner: ${owner} (${guild.owner})\n` +
        `members: ${guild.numMembers}/${guild.maximumMembers} (${guild.numMembersPending} pending)\n` +
        `full: ${guild.full}\n\n` +
        `last updated: <t:${guild.lastUpdated}> (<t:${guild.lastUpdated}:R>)\n` +
        `shortcode: \`${guild.shortcode}\`\n` +
        `activity rating: ${guild.activityRating}\n` +
        `status: ${guild.status}\n` +
        `\`statusInfo: ${JSON.stringify(guild.statusInfo)}\``;
    return new Discord.EmbedBuilder()
        .setTitle(guild.name)
        .setDescription(desc)
        .setColor(blue)
        .setFooter({ text: `guild ID: ${ranksData.userID}` });
}

// stats from guildID
async function getRank(guildID) {
    let body = { leaderboardID: `ct_${eventID}_guilds`, userIDs: [guildID] };
    let nonce = Math.random() * Math.pow(2, 63) + ''; // or any hentai code, but there are much less hentai than 64-bit integers (for now)
    let bodyString = JSON.stringify(body);
    let sig = nksku.signonce.sign(body, nonce, sessionID);

    let k = await nodefetch('https://api.ninjakiwi.com/leaderboard/ranks', {
        method: 'POST',
        body: JSON.stringify({
            data: bodyString,
            auth: {
                session: sessionID,
                appID: appID,
                skuID: skuID,
                device: deviceID
            },
            sig,
            nonce: nonce
        }),
        headers: {
            'User-Agent': UserAgent,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    });
    return await k.json();
}
