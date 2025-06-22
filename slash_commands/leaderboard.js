const { 
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SeparatorSpacingSize,
    SlashCommandBuilder,
    TextDisplayBuilder
} = require('discord.js');

// const { dark_blue } = require('../jsons/colors.json');

builder = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('See leaderbpards for BTD6 events');

const RACE_EMOJI = '<:RaceEvent:1385934643806601278>';

const BOSS_EMOJIS = {
    'bloonarius': '<:BloonariusEvent:1385936999130730617>',
    'lych': '<:LychEvent:1386167061025132614>',
    'vortex': '<:VortexEvent:1385936792468848751>',
    'phayze': '<:PhayzeEvent:1385936576789352528>',
    'dreadbloon': '<:DreadbloonEvent:1385936687229829120>',
    'blastapopoulos': '<:BlastapopoulosEvent:1385936599572938864>'
};
const BOSS_ELITE_EMOJIS = {
    'bloonarius': '<:EliteBloonariusEvent:1385937025344999565>',
    'lych': '<:EliteLychEvent:1386167087436796095>',
    'vortex': '<:EliteVortexEvent:1385936767978569748>',
    'phayze': '<:ElitePhayzeEvent:1385936553238462575>',
    'dreadbloon': '<:EliteDreadbloonEvent:1385936715327475774>',
    'blastapopoulos': '<:EliteBlastapopoulosEvent:1385936632334778410>'
};

const CT_PLAYERS_EMOJI = '<:ContestedTerritoryEvent:1386171150723317810>';
const CT_TEAMS_EMOJI = '<:ContestedTerritoryTeamsEvent:1386171094029045862>';

async function fetchAllEvents(interaction) {
    // races
    response = await fetch("https://data.ninjakiwi.com/btd6/races");
    data = await response.json();
    if (data.error || !data.success) return await leaderboardFetchError(interaction);
    const races = data.body;

    // bosses
    response = await fetch("https://data.ninjakiwi.com/btd6/bosses");
    data = await response.json();
    if (data.error || !data.success) return await leaderboardFetchError(interaction);
    const bosses = data.body;

    // CT
    response = await fetch("https://data.ninjakiwi.com/btd6/ct");
    data = await response.json();
    if (data.error || !data.success) return await leaderboardFetchError(interaction);
    const cts = data.body;

    events = [...races, ...bosses, ...cts];

    events.sort((a, b) => {
        return b.start - a.start; // sort by start time, descending
    });

    return events;
}

async function execute(interaction) {
    
    const events = await fetchAllEvents();
    
    const container = new ContainerBuilder();

    let index = 0;
    let isSeparatorAdded = false; // add a separator only once between past and currently running events
    events.forEach(event => {

        if (index > 7) return; // limit to 10 events
        
        // Convert to seconds
        event.start /= 1000;
        event.end /= 1000;
        
        // remove future events
        if (event.start > Date.now() / 1000) return;

        let eventType = '';
        if (event.leaderboard?.includes('races')) eventType = 'race';
        else if (event.bossType) eventType = 'boss';
        else if (event.leaderboard_player) eventType = 'ct';

        // add a separator dividing between past and currently running events
        if (event.end < Date.now() / 1000 && !isSeparatorAdded) {
            container.addSeparatorComponents(
                separator => separator.setSpacing(SeparatorSpacingSize.Large),
            );
            isSeparatorAdded = true; 
        }

        if (eventType == 'race') {
            const emoji = RACE_EMOJI;

            let textContent = `**${emoji} ${event.name}**
Total players: ${event.totalScores}
<t:${event.start}:f> - <t:${event.end}:f>
${event.end < Date.now() / 1000 ? `ended <t:${event.end}:R>` : `ends <t:${event.end}:R>`}`;

            container.addSectionComponents(
                section => section
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(textContent),
                    )
                    .setButtonAccessory(
                        button => button
                            .setCustomId(event.leaderboard)
                            .setLabel('View')
                            .setStyle(ButtonStyle.Secondary),
                    ),
            );
            index += 1;

        } else if (eventType == 'boss') {
            // normal boss leaderboard
            let emoji = BOSS_EMOJIS[event.bossType] || '';
            let textContent = `**${emoji} ${event.name}**
Total players: ${event.totalScores_standard}
<t:${event.start}:f> - <t:${event.end}:f>
${event.end < Date.now() / 1000 ? `ended <t:${event.end}:R>` : `ends <t:${event.end}:R>`}`;

            container.addSectionComponents(
                section => section
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(textContent),
                    )
                    .setButtonAccessory(
                        button => button
                            .setCustomId(event.leaderboard_standard_players_1)
                            .setLabel('View')
                            .setStyle(ButtonStyle.Secondary),
                    ),
            );

            // elite boss leaderboard
            emoji = BOSS_ELITE_EMOJIS[event.bossType] || '';
            textContent = `**${emoji} ${event.name} (Elite)**
Total players: ${event.totalScores_elite}
<t:${event.start}:f> - <t:${event.end}:f>
${event.end < Date.now() / 1000 ? `ended <t:${event.end}:R>` : `ends <t:${event.end}:R>`}`;

            container.addSectionComponents(
                section => section
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(textContent),
                    )
                    .setButtonAccessory(
                        button => button
                            .setCustomId(event.leaderboard_elite_players_1)
                            .setLabel('View')
                            .setStyle(ButtonStyle.Secondary),
                    ),
            );

            index += 2;
        } else if (eventType == 'ct') {
            // teams leaderboard
            let textContent = `**${CT_TEAMS_EMOJI} CT (Teams)**
Total players: ${event.totalScores_team}
<t:${event.start}:f> - <t:${event.end}:f>
${event.end < Date.now() / 1000 ? `ended <t:${event.end}:R>` : `ends <t:${event.end}:R>`}`;

            container.addSectionComponents(
                section => section
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(textContent),
                    )
                    .setButtonAccessory(
                        button => button
                            .setCustomId(event.leaderboard_team)
                            .setLabel('View')
                            .setStyle(ButtonStyle.Secondary),
                    ),
            );

            // players leaderboard
            textContent = `**${CT_PLAYERS_EMOJI} CT (Players)**
Total players: ${event.totalScores_player}
<t:${event.start}:f> - <t:${event.end}:f>
${event.end < Date.now() / 1000 ? `ended <t:${event.end}:R>` : `ends <t:${event.end}:R>`}`;

            container.addSectionComponents(
                section => section
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(textContent),
                    )
                    .setButtonAccessory(
                        button => button
                            .setCustomId(event.leaderboard_player)
                            .setLabel('View')
                            .setStyle(ButtonStyle.Secondary),
                    ),
            );
            index += 2;
        }
    });

    const response = await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        withResponse: true,

    });

    const collectorFilter = i => i.user.id === interaction.user.id;

    let confirmation;
    try {
        confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
    } catch (error) {
        // remove buttons after timeout? idk
        return;
    }

    const leaderboardURL = confirmation.customId;

    // determine the type of leaderboard from the leaderboard url
    if (leaderboardURL.includes('/races/')) {
        const raceData = events.find(event => event.leaderboard == leaderboardURL);
        await raceLeaderboard(confirmation, raceData);
    }
    else if (leaderboardURL.includes('/bosses/')) {
        const eventData = events.find(event => leaderboardURL.includes(event.id));
        if (leaderboardURL.includes('/elite/')) await bossLeaderboard(confirmation, eventData, true);
        else if (leaderboardURL.includes('/standard/')) await bossLeaderboard(confirmation, eventData, false);
    }
    else if (leaderboardURL.includes('/ct/')) {
        const eventData = events.find(event => leaderboardURL.includes(event.id));
        if (leaderboardURL.includes('/team')) await ctLeaderboardTeam(confirmation, eventData);
        else if (leaderboardURL.includes('/player')) await ctLeaderboardPlayer(confirmation, eventData);
    }
}

async function raceLeaderboard(interaction, eventData) {
    const leaderboardURL = eventData.leaderboard;
    function dataContentFunction(data, page) {
        const SCORES_PER_PAGE = data.length;
        const placementLength = String(SCORES_PER_PAGE * page).length;

        let content = `### Leaderboard for Race "${eventData.name}" Page #${page}\n`;
        data.forEach((score, index) => {
            const placing = String(SCORES_PER_PAGE * (page - 1) + index + 1).padStart(placementLength, ' ');
            const time = formatTime(score.score);
            const timeSubmitted = score.scoreParts.find(scorePart => scorePart.name == "Time after event start").score / 1000 + eventData.start;

            content += `\`${placing} ${time}\` ${score.displayName} (<t:${timeSubmitted}:R>)\n`;            
        });
        
        return content;
    }
    
    reloadNewPage(interaction, leaderboardURL, dataContentFunction);
}

async function bossLeaderboard(interaction, eventData, isElite = false) {
    let leaderboardURL = eventData.leaderboard_standard_players_1;
    if (isElite) leaderboardURL = eventData.leaderboard_elite_players_1;
    function dataContentFunction(data, page) {
        let content = `### ${eventData.name}${isElite ? ' (Elite) ' : ' '}leaderboard Page #${page}\n`;
        content += '```';
        data.forEach((row, index) => {
            const SCORES_PER_PAGE = data.length;
            const placementLength = String(SCORES_PER_PAGE * page).length;

            const placing = String(SCORES_PER_PAGE * (page - 1) + index + 1).padStart(placementLength, ' ');

            let scorePart = 'Game Time'; // this is probably the default
            if (eventData.scoringType == 'LeastTiers') scorePart = 'Tier Count';
            else if (eventData.scoringType == 'LeastCash') scorePart = 'Least Cash';

            let score = row.scoreParts.find(d => d.name == scorePart).score;
            if (scorePart == 'Game Time') score = formatTime(score);

            content += `${placing} ${score} ${row.displayName}\n`;
        });
        content += '```';
        return content;
    }
    reloadNewPage(interaction, leaderboardURL, dataContentFunction);
}

async function ctLeaderboardTeam(interaction, eventData) {
    const leaderboardURL = eventData.leaderboard_team;
    function dataContentFunction(data, page) {
        const SCORES_PER_PAGE = data.length;
        const placementLength = String(SCORES_PER_PAGE * page).length;

        let content = `### CT Teams leaderboard (<t:${eventData.start}:d> - <t:${eventData.end}:d>) Page #${page}\n`;
        content += '```';
        data.forEach((score, index) => {
            const placing = String(SCORES_PER_PAGE * (page - 1) + index + 1).padStart(placementLength, ' ');
            content += `${placing} ${score.score} ${score.displayName}\n`;
        });
        content += '```';
        
        return content;
    }
    
    reloadNewPage(interaction, leaderboardURL, dataContentFunction);
}

async function ctLeaderboardPlayer(interaction, eventData) {
    const leaderboardURL = eventData.leaderboard_player;
    function dataContentFunction(data, page) {
        const SCORES_PER_PAGE = data.length;
        const placementLength = String(SCORES_PER_PAGE * page).length;

        let content = `### CT Players leaderboard (<t:${eventData.start}:d> - <t:${eventData.end}:d>) Page #${page}\n`;
        content += '```';
        data.forEach((score, index) => {
            const placing = String(SCORES_PER_PAGE * (page - 1) + index + 1).padStart(placementLength, ' ');
            content += `${placing} ${score.score} ${score.displayName}\n`;
        });
        content += '```';
        
        return content;
    }
    
    reloadNewPage(interaction, leaderboardURL, dataContentFunction);
}

// the main pagination function
async function reloadNewPage(interaction, leaderboardURL, dataContentFunction, page = 1) {
    const URL = `${leaderboardURL}?page=${page}`;
    const res = await fetch(URL);
    const json = await res.json();
    if (!json.success) return await interaction.editReply({ components: [new TextDisplayBuilder({ content: `An error occured while fetching the [leaderboard](${URL})` })] });
        
    const data = json.body;

    const container = new ContainerBuilder();
        
    let content = dataContentFunction(data, page);

    let components = [];
    if (json.prev) components.push(new ButtonBuilder().setCustomId('-1').setLabel('⬅️').setStyle(ButtonStyle.Primary));
    if (json.next) components.push(new ButtonBuilder().setCustomId('1').setLabel('➡️').setStyle(ButtonStyle.Primary));
        
    container.addTextDisplayComponents(textDisplay => textDisplay.setContent(content));
    container.addActionRowComponents(actionRow => actionRow.addComponents(components));

    const response = await interaction.update({ components: [container], withResponse: true });

    const collectorFilter = i => i.user.id === interaction.user.id;
    let confirmation;
    try {
        confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
    } catch (error) {
        return;
    }
    page += parseInt(confirmation.customId);
    await reloadNewPage(confirmation, leaderboardURL, dataContentFunction, page);
}

async function leaderboardFetchError(interaction) {
    return await interaction.reply({
        content: 'There was an error fetching the leaderboard data.',
        flags: MessageFlags.Ephemeral
    });
}

function formatTime(ms) {
    // score processing
    let minutes = Math.floor(ms / 60000);
    let seconds = Math.floor((ms % 60000) / 1000);
    let mseconds = ms % 1000;

    seconds = seconds.toString().padStart(2, '0');
    mseconds = mseconds.toString().padStart(3, '0');
    let time = seconds === '60' ? `${minutes + 1}:00.000` : `${minutes}:${seconds}.${mseconds}`;
    return time;
}

module.exports = {
    data: builder,
    execute
};