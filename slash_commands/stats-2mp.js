const { SlashCommandStringOption, SlashCommandBuilder } = require("discord.js");
const Index = require('../helpers/index.js');
const Maps = require('../helpers/maps')
const { paleblue } = require('../jsons/colors.json');
const gHelper = require('../helpers/general')

const STATS = [
    TOWER_COMPLETION = 'tower_completion',
    PERSON_COMPLETION = 'person_completion',
    PERSON_UNIQUE_COMPLETION = 'person_unique_completion'
]

const statOption = new SlashCommandStringOption()
    .setName('stat')
    .setDescription('The stat in question')
    .setRequired(true)
    .addChoices(
        { name: 'Tower Completion of Maps', value: TOWER_COMPLETION },
        { name: 'Person Completion of Maps', value: PERSON_COMPLETION },
        { name: 'Person Completion of Unique Maps', value: PERSON_UNIQUE_COMPLETION },
    )

const mapDifficultyOption = new SlashCommandStringOption()
    .setName('map_difficulty')
    .setDescription('Map Difficulty to filter by (default all)')
    .setRequired(false)
    .addChoices(
        { name: 'Beginner', value: 'beginner' },
        { name: 'Intermediate', value: 'intermediate' },
        { name: 'Advanced', value: 'advanced' },
        { name: 'Expert', value: 'expert' },
    )

const reloadOption = new SlashCommandStringOption()
    .setName('reload')
    .setDescription('Do you need to reload completions from the index but for a much slower runtime?')
    .setRequired(false)
    .addChoices({ name: 'Yes', value: 'yes' });

const builder = new SlashCommandBuilder()
    .setName('stats-2mp')
    .setDescription('See Overall Stats for Completed 2MP Index Combos')
    .addStringOption(statOption)
    // .addStringOption(mapDifficultyOption)
    .addStringOption(reloadOption);

async function execute(interaction) {
    await interaction.deferReply();

    const forceReload = interaction.options.getString('reload') ? true : false;

    const allCombos = await Index.fetchInfo('2mp', forceReload);

    const mtime = Index.getLastCacheModified('2mp');

    const stat = interaction.options.getString('stat')
    const mapDifficulty = interaction.options.getString('map_difficulty')

    if (stat === TOWER_COMPLETION) {
        const counts = allCombos
            .map(combo => { return { ENTITY: combo.ENTITY, MAPS: Object.keys(combo.MAPS) } })
            .sort((c1, c2) => c2.MAPS.length - c1.MAPS.length)

        const allMaps = Maps.allMaps().map(m => Maps.mapToIndexAbbreviation(m))

        const colData = {
            ENTITY: counts.map(c => c.ENTITY),
            COUNT: counts.map(c => c.MAPS.length),
            MAPS_LEFT: counts.map(c => {
                const impossibleMaps = Maps.mapsNotPossible(c.ENTITY)
                const allPossibleMaps = allMaps.filter(m => !impossibleMaps.includes(m))
                const unCompletedMaps = allPossibleMaps.filter(m => !c.MAPS.includes(m))

                let mapsLeft;
                if (unCompletedMaps.length === 0) {
                    mapsLeft = 'Ø'
                } else if (unCompletedMaps.length > 5) {
                    mapsLeft = unCompletedMaps.slice(0, 3).join(', ') + ` (+ ${unCompletedMaps.length - 3} more)`
                } else {
                    mapsLeft = unCompletedMaps.join(', ')
                }
                return impossibleMaps.length > 0 ? `${mapsLeft}*` : mapsLeft
            })
        }

        function setOtherDisplayFields(challengeEmbed) {
            challengeEmbed
                .setTitle('2 Million Pops Tower Completion Rankings')
                .setColor(paleblue)
                .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`);

            if (challengeEmbed.data.fields.find(field => field.name.includes('Maps Left'))?.value?.includes('*')) {
                challengeEmbed.setFooter({ text: '*where placement is possible' })
            }
        }

        Index.displayOneOrMultiplePages(interaction, colData, setOtherDisplayFields)
    } else if (stat === PERSON_COMPLETION) {
        const counts = {}
        allCombos.forEach(combo => {
            Object.keys(combo.MAPS).forEach(complMap => {
                const compl = combo.MAPS[complMap]
                counts[compl.PERSON] ||= []
                counts[compl.PERSON].push(complMap)
            })
        })

        const sortedStats = 
            Object.entries(counts)
                .map(cnt =>  {
                    return { 
                        PERSON: cnt[0], 
                        MAPS: cnt[1],
                        FAVORITE_MAP: gHelper.mostCommonElement(cnt[1]),
                        FAVORITE_DIFFICULTY: gHelper.mostCommonElement(cnt[1].map(m => Maps.mapToMapDifficulty(m))).substring(0, 3).toUpperCase()
                    } 
                })
                .sort((c1, c2) => c2.MAPS.length - c1.MAPS.length)
        
        const colData = {
            PERSON: sortedStats.map(c => c.PERSON),
            COUNT: sortedStats.map(c => c.MAPS.length),
            'MAP_/_DIFF._FAVS.': sortedStats.map(c => `${c.FAVORITE_MAP} / ${c.FAVORITE_DIFFICULTY}`)
        }

        function setOtherDisplayFields(challengeEmbed) {
            challengeEmbed
                .setTitle('2 Million Pops Person Completion Rankings')
                .setColor(paleblue)
                .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`);
        }

        Index.displayOneOrMultiplePages(interaction, colData, setOtherDisplayFields)
    } else if (stat === PERSON_UNIQUE_COMPLETION) {
        const counts = {}
        allCombos.forEach(combo => {
            Object.keys(combo.MAPS).forEach(complMap => {
                const compl = combo.MAPS[complMap]
                counts[compl.PERSON] ||= new Set()
                counts[compl.PERSON].add(complMap)
            })
        })

        const sortedStats =
            Object.entries(counts)
                .map(cnt =>  {
                    return {
                        PERSON: cnt[0],
                        MAPS: Array.from(cnt[1]),
                    }
                })
                .sort((c1, c2) => c2.MAPS.length - c1.MAPS.length)

        const allMaps = Maps.allMaps().map(m => Maps.mapToIndexAbbreviation(m))

        const colData = {
            PERSON: sortedStats.map(c => c.PERSON),
            COUNT: sortedStats.map(c => c.MAPS.length),
            'MAPS_LEFT': sortedStats.map(c => {
                const unCompletedMaps = allMaps.filter(m => !c.MAPS.includes(m))
                if (unCompletedMaps.length === 0) {
                    return 'Ø'
                } else if (unCompletedMaps.length > 5) {
                    return unCompletedMaps.slice(0, 3).join(', ') + ` (+ ${unCompletedMaps.length - 3} more)`
                } else {
                    return unCompletedMaps.join(', ')
                }
            })
        }

        function setOtherDisplayFields(challengeEmbed) {
            challengeEmbed
                .setTitle('2 Million Pops Person Unique Completion Rankings')
                .setColor(paleblue)
                .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`);
        }

        Index.displayOneOrMultiplePages(interaction, colData, setOtherDisplayFields)
    }
}

module.exports = {
    data: builder,
    execute
};