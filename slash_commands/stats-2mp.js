const { SlashCommandStringOption, SlashCommandBuilder } = require("discord.js");
const Index = require('../helpers/index.js');
const Maps = require('../helpers/maps')
const { paleblue } = require('../jsons/colors.json');
const gHelper = require('../helpers/general')

const STATS = [
    TOWER_COMPLETION = 'tower_completion',
    PERSON_COMPLETION = 'person_completion',
]

const statOption = new SlashCommandStringOption()
    .setName('stat')
    .setDescription('The stat in question')
    .setRequired(true)
    .addChoices(
        { name: 'Tower Completion of Maps', value: TOWER_COMPLETION },
        { name: 'Person Completion of Maps', value: PERSON_COMPLETION },
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
    .addStringOption(mapDifficultyOption)
    .addStringOption(reloadOption);

async function execute(interaction) {
    await interaction.deferReply();

    const forceReload = interaction.options.getString('reload') ? true : false;

    const allCombos = await Index.fetchInfo('2mp', forceReload);

    const mtime = Index.getLastCacheModified('2mp');

    const stat = interaction.options.getString('stat')
    const mapDifficulty = interaction.options.getString('map_difficulty')
    const mapDifficulties = mapDifficulty ? [mapDifficulty] : Maps.allMapDifficulties()

    if (stat === TOWER_COMPLETION) {
        const counts = allCombos
            .map(combo => [combo.ENTITY, Object.keys(combo.MAPS)])
            .sort((c1, c2) => c1[1].length < c2[1].length ? 1 : -1)

        const allMaps = Maps.allMaps().map(m => Maps.mapToIndexAbbreviation(m))

        const colData = {
            ENTITY: counts.map(c => c[0]),
            COUNT: counts.map(c => c[1].length),
            MAPS_LEFT: counts.map(c => {
                const unCompletedMaps = allMaps.filter(m => !c[1].includes(m))
                console.log(c[0], unCompletedMaps)
                if (unCompletedMaps.length > 5) {
                    return unCompletedMaps.splice(0, 3).join(', ') + ` (+ ${unCompletedMaps.length - 3} more)`
                } else {
                    return unCompletedMaps.join(', ')
                }
            })
        }

        function setOtherDisplayFields(challengeEmbed) {
            challengeEmbed
                .setTitle('2 Million Pops Tower Completion Rankings')
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