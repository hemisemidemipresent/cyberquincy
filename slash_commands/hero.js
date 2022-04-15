const { SlashCommandBuilder } = require('@discordjs/builders');

const axios = require('axios');
const { footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colours.json');
const links = [
    'https://pastebin.com/raw/ASpHNduS',
    'https://pastebin.com/raw/rZYjbEhX',
    'https://pastebin.com/raw/hrH8q0bd',
    'https://pastebin.com/raw/x2WiKEWi',
    'https://pastebin.com/raw/cqaHnhgB',
    'https://pastebin.com/raw/j6X3mazy',
    'https://pastebin.com/raw/dYu1B9bp',
    'https://pastebin.com/raw/2YRMFjPG',
    'https://pastebin.com/raw/WnsgkWRc',
    'https://pastebin.com/raw/amw39T29',
    'https://pastebin.com/raw/UxN2Wx1F',
    'https://pastebin.com/raw/8E2TSndk',
    'https://pastebin.com/raw/9h9aAPUm',
    'https://pastebin.com/raw/rksZWhTV'
];
builder = new SlashCommandBuilder()
    .setName('hero')
    .setDescription('Find information for each hero')
    .addStringOption((option) =>
        option
            .setName('hero')
            .setDescription('The hero you are finding information for')
            .setRequired(true)
            .addChoice('Quincy', '0')
            .addChoice('Gwendolin', '1')
            .addChoice('Striker Jones', '2')
            .addChoice('Obyn Greenfoot', '3')
            .addChoice('Captain Churchill', '4')
            .addChoice('Benjamin', '5')
            .addChoice('Ezili', '6')
            .addChoice('Pat Fusty', '7')
            .addChoice('Adora', '8')
            .addChoice('Admiral Brickell', '9')
            .addChoice('Etienne', '10')
            .addChoice('Sauda', '11')
            .addChoice('Psi', '12')
            .addChoice('Geraldo', '13')
    )
    .addIntegerOption((option) =>
        option.setName('hero_lvl').setDescription("The hero' level that you want the information for.").setRequired(true)
    );

function validateInput(interaction) {
    hero_lvl = interaction.options.getInteger('hero_lvl');
    if (hero_lvl > 20 || hero_lvl < 1)
        return `Invalid hero level \`${hero_lvl}\` provided!\nHero level must be from \`1\` to \`20\` (inclusive)`;
}

async function process(level, heroID) {
    let link = links[heroID];
    let res = '';

    try {
        res = await axios.get(link);
    } catch {
        await interaction.reply({
            embeds: [new Discord.MessageEmbed().setColor(red).setTitle('Something went wrong while fetching the data')],
            ephemeral: true
        });
    }

    let body = res.data;
    let cleaned = body.replace(/\t/g, '').replace(/\r/g, '');
    let sentences = cleaned.split(/\n\n/);

    let desc = sentences[level - 1];
    if (typeof desc != 'string') desc = 'huh';

    return new Discord.MessageEmbed().setDescription(desc).setColor(cyber).setFooter({
        text: footer
    });
}
async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    heroID = parseInt(interaction.options.getString('hero'));
    hero_lvl = interaction.options.getInteger('hero_lvl');

    const embed = await process(hero_lvl, heroID);

    return await interaction.reply({ embeds: [embed], ephemeral: false });
}

module.exports = {
    data: builder,
    execute
};
