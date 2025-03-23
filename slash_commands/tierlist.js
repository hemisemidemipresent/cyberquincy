const { SlashCommandBuilder } = require('discord.js');
const { btd6Version } = require('../1/config.json');

builder = new SlashCommandBuilder()
    .setName('tierlist')
    .setDescription('Returns tier list for given version')
    .addIntegerOption((option) =>
        option.setName('version').setDescription('The version you want the tier list for').setRequired(true)
    );

function validateInput(interaction) {
    const version = interaction.options.getInteger('version');

    // Validations
    if (version < 1) return `The game started in version 1`;
    if (version >= 1 && version < 9) return 'The first index tier list was in v9.0';
    if (version > btd6Version) return `v${version}.0 isn't even out yet`;
    return;
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });

    const version = interaction.options.getInteger('version');
    const text = versionTierlists[version] ?? `The tier list for v${version} hasn't been released yet, go complain on tierlist discord server`;

    return await interaction.reply({ content: text });
}

const versionTierlists = [
    ...Array(9),
    'https://www.reddit.com/r/btd6/comments/bn7wtu/comprehensive_tier_list_for_chimps_by_path/', // 9.0
    "Exephur sucks and didn't make v10 tier list lmao",
    'https://www.reddit.com/r/btd6/comments/cv5mdi/comprehensive_tier_list_for_chimps_by_path/', // 11.0
    'https://www.reddit.com/r/btd6/comments/d9wdk9/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/dq0xee/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/eefaum/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/f1ly0m/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/ffrkze/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/g3kiy2/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/h7iht0/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/huibn2/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/irahad/comprehensive_tier_list_for_chimps_by_path/', // 20.0
    'https://www.reddit.com/r/btd6/comments/jp0ezq/comprehensive_tier_list_for_chimps_by_path/', 
    'https://www.reddit.com/r/btd6/comments/knnwg9/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/lyy5v5/comprehensive_tier_list_for_chimps_by_path/',
    "Exephur sucks and didn't make v24 tier list lmao",
    'https://www.reddit.com/r/btd6/comments/nkn8ct/comprehensive_tier_list_for_chimps_by_path/',
    "Exephur sucks and didn't make v26 tier list lmao",
    'https://www.reddit.com/r/btd6/comments/q6f3vs/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/rc4rkm/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/sig6c0/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/ttdrdg/comprehensive_tier_list_for_chimps_by_path/', // 30.0
    'https://www.reddit.com/r/btd6/comments/uqjt6l/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/xbyxm9/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/z308ew/comprehensive_tier_list_for_expert_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/10mtouf/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/121t4mn/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/13azbxb/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/14vnk2b/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/15ut583/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/17xo8d4/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/196on6s/comprehensive_tier_list_for_chimps_by_path/', // 40.0
    'https://www.reddit.com/r/btd6/comments/1baqo9m/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/1d0iy0y/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/1drlj6n/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/1f0g57d/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/1gms9uo/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/1htmvum/comprehensive_tier_list_for_chimps_by_path/',
    'https://www.reddit.com/r/btd6/comments/1j5ymow/comprehensive_tier_list_for_chimps_by_path/',
    //'v48 tierlist hasnt came out yet (if it has ping hemi)'
];

module.exports = {
    data: builder,
    execute
};
