const { SlashCommandBuilder } = require('discord.js');
const { isValidTempleSet } = require('../helpers/towers');

const { footer } = require('../aliases/misc.json');

const t = require('../jsons/temple.json');
const t2 = require('../jsons/temple2.json');

const { yellow } = require('../jsons/colors.json');

builder = new SlashCommandBuilder()
    .setName('temple')
    .setDescription('Show temple stats')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('by_category')
            .setDescription('Input the amount of money you sacrificed into the temple (you can get this with `/calc`)') //
            .addIntegerOption((option) =>
                option.setName('primary').setDescription('Total amount of money in PRIMARY towers sacrificed')
            )
            .addIntegerOption((option) =>
                option.setName('military').setDescription('Total amount of money in MILITARY towers sacrificed')
            )
            .addIntegerOption((option) =>
                option.setName('magic').setDescription('Total amount of money in MAGIC towers sacrificed')
            )
            .addIntegerOption((option) =>
                option.setName('support').setDescription('amt of money in SUPPORT towers sacrificed')
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('max_temple')
            .setDescription('Input "max" temple (e.g. 1110, 2212)')
            .addStringOption((option) =>
                option
                    .setName('temple_set')
                    .setDescription(
                        'temple with 3 level-9 sacrifices is 1110 if support was skipped, 1101 if magic was skipped, etc'
                    )
                    .setRequired(true)
            )
    );

async function execute(interaction) {
    if (interaction.options.getSubcommand() == 'by_category') await by_category(interaction);
    else await max_temple(interaction);
}

async function by_category(interaction) {
    let primary = interaction.options.getInteger('primary') || 0;
    let military = interaction.options.getInteger('military') || 0;
    let magic = interaction.options.getInteger('magic') || 0;
    let support = interaction.options.getInteger('support') || 0;

    let embed = new Discord.EmbedBuilder();
    embed.setTitle('Temple stats');
    embed.setColor(yellow);

    let fields = [];
    let inputs = [primary, military, magic, support];
    let names = ['Primary', 'Military', 'Magic', 'Support'];
    for (let i = 0; i < 4; i++) {
        let level = cashToLevel(inputs[i]);
        if (level == 0) continue;
        fields.push({ name: `${names[i]} sacrifice ($${inputs[i]} - level ${level}/9)`, value: t[i][level - 1] });
    }
    if (fields.length > 0) {
        embed.setDescription(
            'This command only tells you the **changes** from the temple due to sacrifices. For the base temple with no sacrifices, please use `/tower` with the temple crosspath of choice'
        );
        embed.addFields(fields);
    } else
        embed.setDescription(
            'no changes from due to sacrifices; not enough sacrificed\nFind the base temple stats with `/tower` with the temple crosspath of choice'
        );
    embed.setFooter({ text: 'Cash thresholds for levels are: 300, 1000, 2000, 4000, 7500, 10000, 15000, 25000, 50000' });
    return await interaction.reply({ embeds: [embed] });
}

async function max_temple(interaction) {
    let temple_set = interaction.options.getString('temple_set');
    if (!isValidTempleSet(temple_set))
        return await interaction.reply(
            `Please enter a valid temple set!
            
            This command is for the statistics of a **maxed temple sacrifice**, i.e. the sacrifices **exceed** $50000.
            The **temple set** follows a format of \`<primary>/<military>/<magic>/<support>\`. So for example if you have max sacrifices for only primary and magic, your temple set will be \`1/0/1/0\` (this is usually shortened by removing the slashes to \`1010\`)

            Although this command accepts the temple set of \`1/1/1/1\` or \`1111\`, when sacrificing towers to a Sun Temple, only three categories count. If four categories are sacrificed then the cheapest is ignored.

            The True Sun God, however, can accept sacrifices from all four categories. 
            So for example if you had a \`1101\` temple that u max-sacrificed on all 4 categories, you would get \`1101\` + \`1111\` = \`2212\`
            `
        );
    let templeSet = temple_set
        .replace(/\/+/g, '')
        .split('')
        .map((x) => parseInt(x));

    let embed = new Discord.EmbedBuilder().setColor(yellow);
    embed.setTitle(temple_set);

    for (let i = 0; i < 4; i++) {
        addSacrificeStats(embed, templeSet[i], i);
    }
    await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};

function addSacrificeStats(embed, num, i) {
    const titles = ['Primary sacrifice', 'Military sacrifice', 'Magic sacrifice', 'Support sacrifice'];

    if (num == 0) return;
    if (num == 1) {
        return embed.addFields([{ name: titles[i], value: `${t[i][8]}` }]);
    }
    if (num == 2) {
        return embed.addFields([{ name: titles[i], value: `${t[i][8]}\n\n-----True Sun God-----\n${t2[i]}` }]);
    }
}

/**
 * input cash, returns a number from 0 - 9 about the temple's sacrifice level.
 * @param {int} cash
 * @returns {int}
 */
function cashToLevel(cash) {
    let sacrifice_levels = [300, 1000, 2000, 4000, 7500, 10000, 15000, 25000, 50000];
    for (let i = 0; i < 9; i++) {
        if (cash < sacrifice_levels[i]) return i;
    }
    return 9;
}
