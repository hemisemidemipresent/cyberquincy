const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonStyle,
    SelectMenuBuilder
} = require('discord.js');

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
const towerEmojis = Emojis['753449196132237425'].towers;

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

module.exports = {
    data: builder,
    // the "entry point" to the command
    async execute(interaction) {
        const challengeCode = interaction.options.getString('challenge_code').toLowerCase();

        const objStr = `{"index":"challenges","query":"id:${challengeCode}","limit":1,"offset":0,"hint":"single_challenge","options":{}}`;
        let results = await request(objStr, 'https://api.ninjakiwi.com/utility/es/search');
        results = results.results[0];
        this.userID = results.owner;
        const embed = new Discord.EmbedBuilder()
            .setTitle('Success!')
            .setDescription(`The owner of the challenge's userID is \`${results.owner}\``)
            .addFields([{ name: 'challenge name', value: results.challengeName }])
            .setColor(green);

        // user statistics part

        seeUserAction = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stats').setLabel('See user statistics').setStyle(ButtonStyle.Primary)
        );
        this.user = interaction.user;
        this.interaction = await interaction.reply({ embeds: [embed], components: [seeUserAction] });
    },

    async onButtonClick(interaction) {
        if (interaction.user.id != this.user.id) return;
        if (interaction.customId == 'stats') {
            // load data
            let body;
            let url = `https://priority-static-api.nkstatic.com/storage/static/11/${this.userID}/public-stats`;
            try {
                body = await axios.get(url, { headers: { 'User-Agent': UserAgent } });
            } catch {
                return await interaction.update({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setDescription('invalid user id associated with the challenge code!')
                            .setColor(palered)
                    ],
                    components: []
                });
            }
            let obj = body.data;

            obj.playerName = await getUsernames([this.userID]); // add in username
            this.obj = obj;

            // create the tower selector
            function createSelector(obj) {
                const normalNames = [
                    'Dart Monkey',
                    'Boomerang Monkey',
                    'Bomb Shooter',
                    'Tack Shooter',
                    'Ice Monkey',
                    'Glue Gunner',
                    'Sniper Monkey',
                    'Monkey Sub',
                    'Monkey Buccaneer',
                    'Monkey Ace',
                    'Heli Pilot',
                    'Mortar Monkey',
                    'Dartling Gunner',
                    'Wizard Monkey',
                    'Super Monkey',
                    'Ninja Monkey',
                    'Alchemist',
                    'Druid',
                    'Banana Farm',
                    'Spike Factory',
                    'Monkey Village',
                    'Engineer Monkey'
                ];
                let options = [];
                for (let i = 0; i < normalNames.length; i++) {
                    let codeName = normalNames[i].replace(/ +/g, '') + '1';
                    let monke = obj.namedMonkeyStats[`${codeName}`];
                    option = {
                        label: normalNames[i],
                        value: codeName
                    };
                    if (monke.name) option.description = monke.name;
                    options.push(option);
                }
                options.push({ label: 'Main page', value: 'mainPage' });
                return new SelectMenuBuilder()
                    .setCustomId('towerSelector')
                    .setPlaceholder('Nothing selected')
                    .addOptions(options);
            }
            this.row = new ActionRowBuilder().addComponents(createSelector(this.obj));
            await this.showStats(interaction);
        }
    },

    // this function is in charge of the huge embed for the main user stats page
    async showStats(interaction) {
        let obj = this.obj;

        function mainPage(obj) {
            let name = obj.playerName;
            let winrate = Math.round((obj.gamesWon / obj.gameCount) * 100) / 100;
            let desc = [
                `id: ${obj.playerId}`,
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
                towersPlacedData += `${towerEmojis[name]}: ${amount}\n`;
            }

            let spMedals = JSON.stringify(obj.spMedals, null, 1);
            let coopMedals = JSON.stringify(obj.coopMedals, null, 1);

            let raceMedalsStr = '';
            for (medal in obj.raceMedals) {
                let amt = obj.raceMedals[medal];
                let emoji = raceEmojis[medal];
                raceMedalsStr = `${emoji} ${amt}\n${raceMedalsStr}`; // add from bottom to top
            }

            let bossMedals = JSON.stringify(obj.bossMedals, null, 4);
            let mainEmbed = new EmbedBuilder();

            // playerRank = obj.playerRank;
            // playerXp = obj.playerXp;
            // veteran_rank = obj.veteranRank;
            // veteran_xp = obj.veteranXp;
            let rank = obj.playerRank == 155 ? `Veteran Level ${obj.veteranRank}` : `Level ${obj.playerRank}`;
            mainEmbed
                .setTitle(`${name} (${rank})`)
                .setDescription(desc.join('\n'))
                .addFields([
                    { name: 'Pops', value: popsInfo, inline: true },
                    { name: 'Hero placed stats', value: heroesPlacedData, inline: true },
                    { name: 'Tower placed stats', value: towersPlacedData, inline: true },
                    { name: 'Singleplayer medals', value: spMedals, inline: true },
                    { name: 'Coop medals', value: coopMedals, inline: true },
                    { name: 'Race medals', value: raceMedalsStr, inline: true },
                    { name: 'Boss medals', value: bossMedals, inline: true },
                    { name: 'Odyssey', value: ody, inline: true }
                ])
                .setFooter({
                    text: 'There is way too much data, this will all be polished slowly over time. If emojis are not appearing for you, please enable the "use external emoji" permissions for _everyone_ because discord is weird.'
                });
            return mainEmbed;
        }

        let embed = mainPage(obj);
        await interaction.update({
            embeds: [embed],
            components: [this.row],
            files: [new AttachmentBuilder(Buffer.from(JSON.stringify(obj, null, 1))).setName(`${this.userID}.json`)]
        });
    },

    async onSelectMenu(interaction) {
        let id = interaction.values[0];
        if (id === 'mainPage') {
            await this.showStats(interaction);
        } else {
            await this.showTowerStats(interaction, id);
        }
    },

    async showTowerStats(interaction, tower) {
        let i = this.obj.namedMonkeyStats[tower];
        let embed = new EmbedBuilder();
        if (i.name.length == 0) i.name = i.BaseTower;
        let desc = [
            `games won: ${i.gamesWon}`,
            `highest round: ${i.highestRound}`,
            `times placed ${i.timesPlaced}`,
            `abilities used: ${i.abilitiesUsed}`,
            `times upgraded: ${i.timesUpgraded}`,
            `times sacrificed: ${i.timesSacrificed}`
        ];
        let popinfo = `Total: ${i.totalPopCount || 0}
        Coop: ${i.totalCoopPopCount || 0}
        ${camo} ${i.camoBloonsPopped || 0}
        ${lead} ${i.leadBloonsPopped || 0}
        ${purple} ${i.purpleBloonsPopped || 0}
        ${regrow} ${i.regrowBloonsPopped || 0}
        ${ceramic} ${i.ceramicBloonsPopped || 0}
        ${moab} ${i.moabsPopped || 0}
        ${bfb} ${i.bfbsPopped || 0}
        ${zomg} ${i.zomgsPopped || 0}
        ${ddt} ${i.ddtsPopped || 0}
        ${bad} ${i.badsPopped || 0}`;
        embed
            .setTitle(`name: ${i.name}`)
            .setDescription(desc.join('\n'))
            .addFields([{ name: 'Pops', value: popinfo }]);
        return await interaction.update({ embeds: [embed], files: [], components: [this.row] });
    }
};

// just a general "request" function
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
        return new Discord.EmbedBuilder()
            .setTitle('Invalid Challenge Code!')
            .addField('In case this is a valid challenge code:', `report it to the [discord server](${discord})`)
            .setColor(red);
    }
}
