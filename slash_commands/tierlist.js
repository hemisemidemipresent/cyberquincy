const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder()
    .setName('tierlist')
    .setDescription('Returns tier list for given version')
    .addIntegerOption((option) =>
        option
            .setName('version')
            .setDescription('The version you want the tier list for')
            .setRequired(true)
    );

function validateInput(interaction) {
    const version = interaction.options.getInteger('version');

    // Validations
    if (version < 1) return `The game started in version 1`;
    if (version >= 1 && version < 9) return 'The first index tier list was in v9.0';
    if (version == 32) return `The tier list for v${version} hasn't been released yet, go complain to index`;
    if (version > 31) return `v${version}.0 isn't even out yet`;
    return;
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    const version = interaction.options.getInteger('version');
    const text =
        versionTierlists[version] ??
        `The tier list for v${version} hasn't been released yet, go complain to index`;

    return await interaction.reply({
        content: text
    });
}

const versionTierlists = [
    ...Array(9),
    'https://www.reddit.com/r/btd6/comments/bn7wtu/comprehensive_tier_list_for_chimps_by_path/',
    "There isn't a v10 tier list, go complain to past Randy",
    'https://www.reddit.com/r/btd6/comments/cv5mdi/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/d9wdk9/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/dq0xee/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/eefaum/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/f1ly0m/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/ffrkze/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/g3kiy2/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/h7iht0/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/huibn2/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/irahad/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/jp0ezq/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/knnwg9/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/lyy5v5/comprehensive_tier_list_for_chimps_by_path/',
    "Exephur sucks and didn't make v24 tier list lmao",
    'https://www.reddit.com/r/btd6/comments/nkn8ct/comprehensive_tier_list_for_chimps_by_path/',
    "Exephur sucks and didn't make v26 tier list lmao",
    'https://www.reddit.com/r/btd6/comments/q6f3vs/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/rc4rkm/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/sig6c0/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/ttdrdg/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/uqjt6l/comprehensive_tier_list_for_chimps_by_path/'
];

module.exports = {
    data: builder,
    execute
};
