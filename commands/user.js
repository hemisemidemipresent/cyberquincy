const { default: axios } = require('axios');
const { MessageEmbed, MessageSelectMenu, MessageActionRow, MessageAttachment } = require('discord.js');
const { palered } = require('../jsons/colours.json');
const { UserAgent } = require('../1/config.json');
const { getUsernames } = require('../helpers/usernames');
const Emojis = require('../jsons/emojis.json');
const { camo, lead, purple, regrow, ceramic, moab, bfb, zomg, ddt, bad } = Emojis['614111055890612225'].bloon;
const { adora, benjamin, brickell, churchill, etienne, ezili, geraldo, gwen, jones, obyn, pat, psi, quincy, sauda } =
    Emojis['614111055890612225'].hero;
const raceEmojis = Emojis['753449196132237425'].race;

module.exports = {
    name: 'user',
    aliases: ['stats'],
    casedArgs: true,
    botMessage: undefined,
    interaction: undefined,
    row: undefined,
    message: undefined,
    obj: {},
    async execute(message, args) {
        this.message = message;

        if (args.length == 0 || (args.length == 1 && args[0].toLowerCase() == 'help'))
            return await module.exports.helpMessage(message);

        userID = args[0];
        let url = `https://priority-static-api.nkstatic.com/storage/static/11/${userID}/public-stats`;
        let body;
        try {
            body = await axios.get(url, {
                headers: { 'User-Agent': UserAgent }
            });
        } catch {
            return await message.channel.send({
                embeds: [new Discord.MessageEmbed().setDescription('invalid user id').setColor(palered)]
            });
        }
        let obj = body.data;
        this.obj = obj;
        obj.timeStamp = Date.now().toString();
        obj.playerName = await getUsernames([userID]);
        let embed = mainPage(obj);

        if (!isEmpty(obj.namedMonkeyStats)) {
            let towerSelector = createSelector(obj);
            this.row = new MessageActionRow().addComponents(towerSelector);
            this.botMessage = await message.channel.send({
                embeds: [embed],
                components: [this.row],
                files: [new MessageAttachment(Buffer.from(JSON.stringify(obj, null, 1)), userID + '.json')]
            });
            await this.createCollector(message);
        } else
            await message.channel.send({
                embeds: [embed]
            });
    },
    async helpMessage(message) {
        let embed = new MessageEmbed()
            .setTitle('BIG BROTHER IS WATCHING YOU')
            .setDescription('`q!user <user id>` e.g. `q!user 5aa98318a0c6fb3a5e30c047` (tarn)')
            .addField(
                'How do I get my user id?',
                'The easiest way is to get top 100 of the race leaderboard and use `q!lb <placement>` or `q!lb u#username`\notherwise you can check out [this video](https://youtu.be/SJ4Tczw1LyA)'
            )
            .addField(
                'If you are on windows',
                '(by <@746205219238707210>):Open BTD6\nGo to Content Browser\nSort by "My Challenges"\nPress Win+R and paste `C:\\Users\\YOUR USERNAME\\AppData\\Local\\Temp\\Ninja Kiwi\\BloonsTD6` in and press Enter/OK\nDelete `statsCache`\nClick Refresh on the Challenge Browser\nOpen `statsCache`)'
            );

        await message.channel.send({ embeds: [embed] });
    },
    async createCollector(message) {
        const filter = (i) => i.user.id == message.author.id;
        const collector = await module.exports.botMessage.createMessageComponentCollector({
            filter,
            time: 20000
        });
        collector.on('collect', async (i) => {
            collector.stop();
            module.exports.interaction = i;
            await module.exports.processInteraction(i, this.obj);
        });
    },
    async processInteraction(i, obj) {
        let id = i.values[0];
        let embed;

        embed = showInstaStats(obj, id);

        await this.interaction.update({ embeds: [embed] });
        await this.createCollector(this.message);
    }
};

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
    if (Object.keys(obj.raceMedals) == 0) {
        raceMedalsStr = 'none';
    }

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
function showInstaStats(obj, insta) {
    let i = obj.namedMonkeyStats[`${insta}`];
    let embed = new MessageEmbed();
    if (i.name.length == 0) i.name = i.BaseTower;
    let desc = [
        `games won: ${i.gamesWon}`,
        `highest round: ${i.highestRound}`,
        `times placed ${i.timesPlaced}`,
        `abilities used: ${i.abilitiesUsed}`,
        `times upgraded: ${i.timesUpgraded}`,
        `times sacrificed: ${i.timesSacrificed}`
    ];
    let popinfo = [
        `total: ${i.totalPopCount}`,
        `coop: ${i.totalCoopPopCount}`,
        `camo: ${i.camoBloonsPopped}`,
        `lead: ${i.leadBloonsPopped}`,
        `purple: ${i.purpleBloonsPopped}`,
        `regrow: ${i.regrowBloonsPopped}`,
        `ceram: ${i.ceramicBloonsPopped}`,
        `moab: ${i.moabsPopped}`,
        `bfb: ${i.bfbsPopped}`,
        `zomg: ${i.zomgsPopped}`,
        `ddt: ${i.ddtsPopped}`,
        `bad: ${i.badsPopped}`
    ];
    embed
        .setTitle(`name: ${i.name}`)
        .setDescription(desc.join('\n'))
        .addField('Pops', popinfo.join('\n'))
        .setFooter({ text: 'sorry you cant go back to the main page' });
    return embed;
}
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
    return new MessageSelectMenu().setCustomId('towerSelector').setPlaceholder('Nothing selected').addOptions(options);
}
function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) return false;
    }
    return true;
}
