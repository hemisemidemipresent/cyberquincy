const { SlashCommandBuilder } = require('discord.js');
const gHelper = require('../helpers/general.js');

const Bosses = require('../jsons/boss.json');

const builder = new SlashCommandBuilder()
    .setName('boss')
    .setDescription('Find information for boss blimps')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Which boss it is')
            .addChoices(
                { name: 'Bloonarius', value: 'Bloonarius' },
                { name: 'Gravelord Lych', value: 'Lych' },
                { name: 'Vortex: Deadly Master of Air', value: 'Vortex' },
                { name: 'Dreadbloon: Armored Behemoth', value: 'Dreadbloon' },
                { name: 'Reality Warper Phayze', value: 'Phayze' }
            )
            .setRequired(true)
    )
    .addIntegerOption((option) => option.setName('tier').setDescription('Tier of the boss').setRequired(true))
    .addBooleanOption((option) =>
        option.setName('elite').setDescription('Whether the boss is elite or not').setRequired(true)
    );

function validateInput(interaction) {
    const tier = interaction.options.getInteger('tier');
    if (tier < 1 || tier > 5) return 'Invalid Boss tier!';
}

async function execute(interaction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    const tier = interaction.options.getInteger('tier');
    const boss = interaction.options.getString('name');
    const isElite = interaction.options.getBoolean('elite');

    let data = Bosses[boss];
    let embed = process(data, boss, tier, isElite);

    return await interaction.reply({ embeds: [embed] });
}

function process(data, name, tier, isElite) {
    let embed = new Discord.EmbedBuilder().setTitle(`${isElite ? 'Elite' : ''} ${name} Tier ${tier}`);
    let desc = data.desc + '\n\n' + (isElite ? data.eliteDesc : data.normalDesc);
    let obj = isElite ? data.elite[tier - 1] : data.normal[tier - 1];
    desc += `\n\n**Stats**:
Health: ${gHelper.numberWithCommas(obj.hp)}
Speed: ${obj.speed}x red bloon speed
${obj.desc}
\`\`\`${data.customRounds}\`\`\``;
    embed.setDescription(desc);
    return embed;
}

module.exports = {
    data: builder,
    execute
};
