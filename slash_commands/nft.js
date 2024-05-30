const { SlashCommandBuilder } = require('discord.js');
const { red, cyber } = require('../jsons/colors.json');

const builder = new SlashCommandBuilder()
    .setName('nft')
    .setDescription('Calculate Quincy Action Figure buy/sell price in Shol Geraldo\'s shop (no MK by default)')
    .addIntegerOption(option => option.setName('unlock_round').setDescription("Start of round when the action figure is unlocked").setRequired(true).setMinValue(1))
    .addIntegerOption(option => option.setName('start_round').setDescription("Round when the action figure is bought").setRequired(true).setMinValue(1))
    .addIntegerOption(option => option.setName('end_round').setDescription("Round when the action figure is sold").setRequired(true).setMinValue(1))
    .addStringOption(option => option
        .setName('difficulty')
        .setDescription("Gamemode difficulty")
        .setRequired(true)
        .addChoices(
            { name: 'Easy (Primary only)', value: 'easy' },
            { name: 'Medium (Military only, Reverse, Apopalypse)', value: 'medium' },
            { name: 'Hard (Magic only, Double HP, ABR)', value: 'hard' },
            { name: 'Impoppable', value: 'impoppable' }
        )
    )
    .addBooleanOption(option => option
        .setName('better_sell_deals')
        .setDescription("Whether the Better Sell Deals MK is enabled")
        .setRequired(false)
    );

const DIFFICULTY_TO_BASE_VALUE = {
    easy: 550,
    medium: 650,
    hard: 700,
    impoppable: 780
};

/**
 * @param {number} unlock_round
 * @param {number} round
 * @param {string} difficulty
 */
function raw_nft_value(unlock_round, round, difficulty) {
    let raw_result = DIFFICULTY_TO_BASE_VALUE[difficulty]
    * Math.pow(1.1, Math.min(round - unlock_round, 31 - unlock_round))
    * Math.pow(1.05, Math.max(Math.min(round - 31, 80 - 31), 0))
    * Math.pow(1.02, Math.max(round - 81, 0));
    return raw_result;
}

async function execute(interaction) {
    let unlock_round = interaction.options.getInteger("unlock_round");
    let start_round = interaction.options.getInteger("start_round");
    let end_round = interaction.options.getInteger("end_round");
    let difficulty = interaction.options.getString("difficulty");
    let better_sell_deals = interaction.options.getBoolean("better_sell_deals") ?? false;

    if (start_round < unlock_round) {
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(`Start round ${start_round} must be greater than or equal to the unlock round ${unlock_round}`)
                    .setColor(red)
            ]
        });
    }
    if (end_round < start_round) {
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(`End round ${end_round} must be greater than or equal to the start round ${start_round}`)
                    .setColor(red)
            ]
        });
    }

    let start_price = Math.round(raw_nft_value(unlock_round, start_round, difficulty) / 5) * 5;
    let end_price = Math.ceil(
        raw_nft_value(unlock_round, end_round, difficulty) * 0.95 + DIFFICULTY_TO_BASE_VALUE[difficulty] * (better_sell_deals ? 0.05 : 0)
    );

    return await interaction.reply({
        embeds: [
            new Discord.EmbedBuilder()
                .setTitle(`You will make a profit of $${end_price - start_price}`)
                .setDescription(`Buy price: $${start_price}\nSell price: $${end_price}\n(Better Sell Deals MK enabled: ${better_sell_deals})`)
                .setColor(cyber)
        ]
    });
}

module.exports = {
    data: builder,
    execute
};
