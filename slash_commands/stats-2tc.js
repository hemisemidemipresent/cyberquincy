const { SlashCommandStringOption, SlashCommandBuilder } = require("discord.js");
const Index = require('../helpers/index.js');
const Maps = require('../helpers/maps')
const { palered } = require('../jsons/colors.json');
const gHelper = require('../helpers/general')

const STATS = [
    TOWER_COMPLETION,
    PERSON_COMPLETION,
]

const statOption = new SlashCommandStringOption()
    .setName('stat')
    .setDescription('The stat in question')
    .setRequired(true)
    .addChoices(
        { name: 'Tower Completion of Combos', value: TOWER_COMPLETION },
        { name: 'Person Completion of Combos', value: PERSON_COMPLETION },
    )

const ogOnlyOption = new SlashCommandStringOption()
    .setName('og_only')
    .setDescription('Whether to limit the stat to just OG completions')
    .setRequired(false)
    .addChoices({ name: 'Yes', value: 'yes' })

const reloadOption = new SlashCommandStringOption()
    .setName('reload')
    .setDescription('Do you need to reload completions from the index but for a much slower runtime?')
    .setRequired(false)
    .addChoices({ name: 'Yes', value: 'yes' });

const builder = new SlashCommandBuilder()
    .setName('stats-2tc')
    .setDescription('See Overall Stats for Completed 2TC Index Combos')
    .addStringOption(statOption)
    .addStringOption(ogOnlyOption)
    .addStringOption(reloadOption);

async function execute(interaction) {
    await interaction.deferReply();

    const forceReload = interaction.options.getString('reload') ? true : false;

    const allCombos = await Index.fetchInfo('2tc', forceReload);

    const mtime = Index.getLastCacheModified('2tc');

    const stat = interaction.options.getString('stat')
    const isOG = interaction.options.getString('og_only') ? true : false;

    if (stat === TOWER_COMPLETION) {
        const counts = {}
        allCombos.forEach(combo => {
            [1, 2].forEach(n => {
                const entity = combo[`TOWER_${n}`].NAME
                const otherEntity = combo[`TOWER_${3 - n}`].NAME
                const numMaps = isOG ? 1 : Object.keys(combo.MAPS).length

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
        }

        if (!isOG) {
            colData.MOST_PROLIFIC_OTHER = sortedStats.map(c => {
                const tower = gHelper.mostCommonElement(c.OTHER_TOWERS)
                const count = c.OTHER_TOWERS.filter(t => t === tower).length
                return `${tower} (${count})`
            })
        }

        function setOtherDisplayFields(challengeEmbed) {
            challengeEmbed
                .setTitle(`2 Tower CHIMPS Individual Tower Rankings${isOG ? ' (OG Only)' : ''}`)
                .setColor(palered)
                .setDescription(`Index last reloaded ${gHelper.timeSince(mtime)} ago`);
        }

        Index.displayOneOrMultiplePages(interaction, colData, setOtherDisplayFields)
    } else if (stat === PERSON_COMPLETION) {
        const counts = {}
        allCombos.forEach(combo => {
            Object.keys(combo.MAPS).forEach(complMap => {
                const compl = combo.MAPS[complMap]
                if (isOG && !compl.OG) return // continue

                const towers = [combo.TOWER_1.NAME, combo.TOWER_2.NAME]
                
                counts[compl.PERSON] ||= []
                counts[compl.PERSON].push({ MAP: complMap, TOWERS: towers})
            })
        })

        const sortedStats = 
            Object.entries(counts)
                .map(cnt =>  {
                    return { 
                        PERSON: cnt[0], 
                        COUNT: Object.keys(cnt[1]).length,
                        FAVORITE_MAP: gHelper.mostCommonElement(
                            Object.values(cnt[1]).map(info => info.MAP)
                        ),
                        FAVORITE_TOWER: gHelper.mostCommonElement(
                            Object.values(cnt[1]).map(info => info.TOWERS).flat()
                        )
                    } 
                })
                .sort((c1, c2) => c2.COUNT - c1.COUNT)
        
        const colData = {
            PERSON: sortedStats.map(c => c.PERSON),
            COUNT: sortedStats.map(c => c.COUNT),
        }

        if (isOG) {
            colData['TOWER FAV.'] = sortedStats.map(c => c.FAVORITE_TOWER)
        } else {
            colData['MAP_/_TOWER_FAVS.'] = sortedStats.map(c => `${c.FAVORITE_MAP} / ${c.FAVORITE_TOWER}`)
        }

        function setOtherDisplayFields(challengeEmbed) {
            challengeEmbed
                .setTitle('2 Tower CHIMPS Person Completion Rankings')
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