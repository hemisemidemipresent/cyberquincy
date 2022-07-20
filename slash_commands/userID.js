const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton, MessageActionRow, MessageAttachment } = require('discord.js');

const { default: axios } = require('axios');
const nodefetch = require('node-fetch');
const nksku = require('nksku');

const { getUsernames } = require('../helpers/usernames');

const { UserAgent } = require('../1/config.json');
const { discord } = require('../aliases/misc.json');

const { red, green } = require('../jsons/colours.json');

const Emojis = require('../jsons/emojis.json');

const { camo, lead, purple, regrow, ceramic, moab, bfb, zomg, ddt, bad } = Emojis['614111055890612225'].bloon;
const { adora, benjamin, brickell, churchill, etienne, ezili, geraldo, gwen, jones, obyn, pat, psi, quincy, sauda } =
    Emojis['614111055890612225'].hero;
const raceEmojis = Emojis['753449196132237425'].race;

const appID = 11;
const skuID = 35;
const sessionID = null;
const deviceID = null;

builder = new SlashCommandBuilder()
    .setName('userid')
    .setDescription("Get your (or any other person's) user ID")

    .addStringOption((option) =>
        option
            .setName('challenge_code')
            .setDescription('A challenge code from the person whose user ID you want to find')
            .setRequired(true)
    );

async function request(objStr, url) {
    const nonce = Math.random() * Math.pow(2, 63) + '';
    try {
        let k = await nodefetch(url, {
            method: 'POST',
            body: JSON.stringify({
                data: objStr,
                auth: {
                    session: sessionID,
                    appID: appID,
                    skuID: skuID,
                    device: deviceID
                },
                sig: nksku.signonce.sign(objStr, nonce),
                nonce: nonce
            }),
            headers: { 'User-Agent': UserAgent, 'Content-Type': 'application/json' }
        });
        let res = await k.json();
        return JSON.parse(res.data);
    } catch (error) {
        return new Discord.MessageEmbed()
            .setTitle('Invalid Challenge Code!')
            .addField('In case this is a valid challenge code:', `report it to the [discord server](${discord})`)
            .setColor(red);
    }
}
module.exports = {
    data: builder,
    user: null,
    async execute(interaction) {
        const challengeCode = interaction.options.getString('challenge_code').toLowerCase();
        const objStr = `{"index":"challenges","query":"id:${challengeCode}","limit":1,"offset":0,"hint":"single_challenge","options":{}}`;

        let results = await request(objStr, 'https://api.ninjakiwi.com/utility/es/search');
        results = results.results[0];
        this.userID = results.owner;
        const embed = new Discord.MessageEmbed()
            .setTitle('Success!')
            .setDescription(`The owner of the challenge's userID is \`${results.owner}\``)
            .addField('challenge name', results.challengeName)
            .setColor(green);

        row = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('stats').setLabel('See user statistics').setStyle('PRIMARY')
        );
        this.user = interaction.user;
        this.interaction = await interaction.reply({ embeds: [embed], components: [] });
    },
    async onButtonClick(bInter) {
        // bInter = button Interaction
        if (bInter.user.id != this.user.id) return;
        if (bInter.customId != 'stats') return;

        await this.showStats(bInter);
    },
    async showStats(interaction) {
        let body;
        let url = `https://priority-static-api.nkstatic.com/storage/static/11/${this.userID}/public-stats`;
        try {
            body = await axios.get(url, { headers: { 'User-Agent': UserAgent } });
        } catch {
            return await interaction.update({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription('invalid user id associated with the challenge code!')
                        .setColor(palered)
                ],
                components: []
            });
        }

        let obj = body.data;
        this.obj = obj;
        obj.playerName = await getUsernames([this.userID]);

        function mainPage(obj) {
            let name = obj.playerName;
            let winrate = Math.round((obj.gamesWon / obj.gameCount) * 100) / 100;
            let desc = [
                `id: ${obj.playerId}`,
                `rank: ${obj.playerRank}`,
                `playerXp: ${obj.playerXp}`,
                `veteran rank: ${obj.veteranRank}`,
                `veteran xp: ${obj.veteranXp}`,
                `avatar: ${obj.avatar}`,
                `banner: ${obj.banner}`,
                `game count: ${obj.gameCount}`,
                `games won: ${obj.gamesWon}`,
                `win rate: ${winrate}%`,
                `highest round: ${obj.highestRound}`,
                `monkeys placed: ${obj.monkeysPlaced}`,
                `bloons leaked: ${obj.bloonsLeaked}`,
                `cash earned (total): ${obj.bloonsLeaked}`,
                `insta monkeys used: ${obj.instaMonkeysUsed}`,
                `powers used: ${obj.powersUsed}`,
                `abilities used: ${obj.abilitiesUsed}`,
                `coop bloons popped: ${obj.coopBloonsPopped}`,
                `coop cash given: ${obj.coopCashGiven}`,
                `necro bloons reanimated: ${obj.necroBloonsReanimated}`,
                `transforming tonics used: ${obj.transformingTonicsUsed}`,
                `most experienced monkey: ${obj.mostExperiencedMonkey} (${obj.mostExperiencedMonkeyXp} xp)`,
                `insta monkey count?: ${obj.instaMonkeyCollection}`,
                `collection chests opened: ${obj.collectionChestsOpened}`,
                `golden bloons popped: ${obj.goldenBloonsPopped}`,
                `monkey teams wins: ${obj.monkeyTeamsWins}`,
                `daily chests: ${obj.dailyRewards}`,
                `challenges completed: ${obj.challengesCompleted}`,
                `total trophies: ${obj.totalTrophiesEarned}`
            ];
            const popsInfo = `Total: ${obj.bloonsPopped}
                ${camo} ${obj.camosPopped}
                ${lead} ${obj.leadsPopped}
                ${purple} ${obj.purplesPopped}
                ${regrow} ${obj.regrowsPopped}
                ${ceramic} ${obj.ceramicsPopped}
                ${moab} ${obj.moabsPopped}
                ${bfb} ${obj.bfbsPopped}
                ${zomg} ${obj.zomgsPopped}
                ${ddt} ${obj.ddtsPopped}
                ${bad} ${obj.badsPopped}`;

            let ody = `total odysseys completed: ${obj.totalOdysseysCompleted}
            total odyssey stars: ${obj.totalOdysseyStars}`;

            // heroes
            let heroes = obj.heroesPlacedData;
            let sortable = [];
            for (let hero in heroes) {
                sortable.push([hero, heroes[hero]]);
            }
            sortable.sort((a, b) => b[1] - a[1]); // descending order
            let heroesPlacedData = '';

            const heroEmojiPairing = {
                Quincy: quincy,
                StrikerJones: jones,
                Benjamin: benjamin,
                Gwendolin: gwen,
                PatFusty: pat,
                CaptainChurchill: churchill,
                Ezili: ezili,
                Adora: adora,
                AdmiralBrickell: brickell,
                Etienne: etienne,
                Sauda: sauda,
                Psi: psi,
                Geraldo: geraldo,
                ObynGreenfoot: obyn
            };

            for (let i = 0; i < sortable.length; i++) {
                let [name, amount] = sortable[i];
                name = heroEmojiPairing[name] ? heroEmojiPairing[name] : name + ':';
                heroesPlacedData += `${name} ${amount}\n`;
            }

            // towers

            let towers = obj.towersPlacedData;
            sortable = [];
            for (let tower in towers) {
                sortable.push([tower, towers[tower]]);
            }
            sortable.sort((a, b) => b[1] - a[1]); // descending order
            let towersPlacedData = '';
            for (let i = 0; i < sortable.length; i++) {
                let [name, amount] = sortable[i];
                towersPlacedData += `${name}: ${amount}\n`;
            }

            let spMedals = JSON.stringify(obj.spMedals, null, 1);
            let coopMedals = JSON.stringify(obj.coopMedals, null, 1);

            let raceMedalsStr = '';
            for (medal in obj.raceMedals) {
                let amt = obj.raceMedals[medal];
                let emoji = raceEmojis[medal];
                raceMedalsStr = `${emoji} ${amt}\n${raceMedalsStr}`; // add from bottom to top
            }
            let bossMedals = `normal: ${obj.bossMedals['0']}\nelite: ${obj.bossMedals['1']}`;
            let mainEmbed = new MessageEmbed();
            mainEmbed
                .setTitle(`${name}'s stats`)
                .setDescription(desc.join('\n'))
                .addField('Pops', popsInfo, true)
                .addField('Hero placed stats', heroesPlacedData, true)
                .addField('Tower placed stats', towersPlacedData, true)
                .addField('Singleplayer medals', spMedals, true)
                .addField('Coop medals', coopMedals, true)
                .addField('Race medals', raceMedalsStr, true)
                .addField('Boss medals', bossMedals, true)
                .addField('Odyssey', ody, true)
                .setFooter({
                    text: 'There is way too much data, this will all be polished slowly over time, before NK inevitably kills this OP system. btw this "datasniffing" has been around this entire time'
                });
            return mainEmbed;
        }
        let embed = mainPage(obj);
        a = client.emojis.cache.find((emoji) => emoji.name === 'top1percent').toString();
        embed.addField('a', a);
        await interaction.update({
            embeds: [embed],
            components: [],
            files: [new MessageAttachment(Buffer.from(JSON.stringify(obj, null, 1)), `${this.userID}.json`)]
        });
    }
};
