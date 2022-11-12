const { SlashCommandStringOption, SlashCommandBuilder } = require("discord.js");
const Index = require('../helpers/index.js');
const Maps = require('../helpers/maps')
const { palered } = require('../jsons/colors.json');
const gHelper = require('../helpers/general')

const STATS = [
    TOWER_COMPLETION
]

const statOption = new SlashCommandStringOption()
    .setName('stat')
    .setDescription('The stat in question')
    .setRequired(true)
    .addChoices(
        { name: 'Tower Completion of Combos', value: TOWER_COMPLETION },
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
    .setName('stats-2tc')
    .setDescription('See Overall Stats for Completed 2TC Index Combos')
    .addStringOption(statOption)
    // .addStringOption(mapDifficultyOption)
    .addStringOption(reloadOption);

async function execute(interaction) {
    await interaction.deferReply();

    const forceReload = interaction.options.getString('reload') ? true : false;

    const allCombos = await Index.fetchInfo('2tc', forceReload);

    const mtime = Index.getLastCacheModified('2tc');

    const stat = interaction.options.getString('stat')
    const mapDifficulty = interaction.options.getString('map_difficulty')

    if (stat === TOWER_COMPLETION) {
        const counts = {}
        allCombos.forEach(combo => {
            [1, 2].forEach(n => {
                const entity = combo[`TOWER_${n}`].NAME
                const otherEntity = combo[`TOWER_${3 - n}`].NAME
                const numMaps = Object.keys(combo.MAPS).length

                counts[entity] ||= []
                counts[entity].push(...Array(numMaps).fill(otherEntity))
            })
        })

        const sortedStats =
            Object.entries(counts)
            .map(cnt =>  {
                return {
                    TOWER: cnt[0],
                    OTHER_TOWERS: cnt[1],
                }
            })
            .sort((c1, c2) => c2.OTHER_TOWERS.length - c1.OTHER_TOWERS.length)
        
        const colData = {
            TOWER: sortedStats.map(c => c.TOWER),
            COUNT: sortedStats.map(c => c.OTHER_TOWERS.length),
            MOST_PROLIFIC_OTHER: sortedStats.map(c => {
                const tower = gHelper.mostCommonElement(c.OTHER_TOWERS)
                const count = c.OTHER_TOWERS.filter(t => t === tower).length
                return `${tower} (${count})`
            }),
        }

        function setOtherDisplayFields(challengeEmbed) {
            challengeEmbed
                .setTitle('2 Tower CHIMPS Individual Tower Rankings')
                .setColor(palered)
                .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`);
        }

        Index.displayOneOrMultiplePages(interaction, colData, setOtherDisplayFields)
    }
}

module.exports = {
    data: builder,
    execute
};