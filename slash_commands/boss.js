const { SlashCommandBuilder } = require('@discordjs/builders');
const { Bloonarius } = require('../jsons/boss.json');
const { Lych } = require('../jsons/boss.json');
const { Vortex } = require('../jsons/boss.json');

const builder = new SlashCommandBuilder()
    .setName('boss')
    .setDescription('Find information for boss blimps')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Which boss it is')
            .addChoices(
                { name: 'Bloonarius', value: 'bloonarius' },
                { name: 'Gravelord Lych', value: 'lych' },
                { name: 'Vortex: Deadly Master of Air', value: 'vortex' }
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

    let embed;
    switch (boss) {
        case 'bloonarius':
            embed = process(Bloonarius, 'Bloonarius', tier, isElite);
            break;
        case 'lych':
            embed = process(Lych, 'Lych', tier, isElite);
            break;
        case 'vortex':
            embed = process(Vortex, 'Vortex', tier, isElite);
            break;
    }
    return await interaction.reply({ embeds: [embed] });
}

function process(data, name, tier, isElite) {
    let embed = new Discord.MessageEmbed().setTitle(`${isElite ? 'Elite' : ''} ${name} Tier ${tier}`);

    let desc = data.desc + '\n' + isElite ? data.eliteDesc : normalDesc;
    let obj = isElite ? data.elite[tier - 1] : data.normal[tier - 1];
    desc += `\n\n**Stats**:
    Health: ${obj.hp}
    Speed: ${obj.speed} rbs/s
    ${obj.desc}
    \`\`\`${data.customRounds}\`\`\``;
    embed.setDescription(desc);
    return embed;
}

module.exports = {
    data: builder,
    execute
};
