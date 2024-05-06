const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

const axios = require('axios');
const { footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colors.json');
const { SlashCommandIntegerOption } = require('@discordjs/builders');

const items = ['Shooty Turret', 'Stack of Old Nails', 'Creepy Idol', 'Jar of Pickles', 'Rare Quincy Action Figure', 'See Invisibility Potion', 'Tube of Amaz-o-Glue', 'Sharpening Stone', 'Worn Hero\'s Cape', 'Blade Trap', 'Bottle of \'Gerry\'s Fire\' Hot Sauce', 'Fertilizer', 'Pet Bunny', 'Rejuv Potion', 'Genie Bottle', 'Paragon Power Totem'];

const itemOptions = new SlashCommandStringOption()
    .setName('item')
    .setDescription('Geraldo\'s Shop Item that you are looking for information on')
    .setRequired(true);
    items.forEach(item => {itemOptions.addChoices({ name: Aliases.toIndexNormalForm(item), value: item });
});

const builder = new SlashCommandBuilder()
    .setName('geraldosshop')
    .setDescription('Find Information on Geraldo\'s shop items')
    .addStringOption(itemOptions)
    .addIntegerOption((option) =>
        option.setName('geraldo_lvl').setDescription('The Geraldo level that you want the information for').setRequired(true)
    );

function validateInput(interaction) {
    const geraldoLevel = interaction.options.getInteger('geraldo_lvl');
    if (geraldoLevel && (geraldoLevel > 20 || geraldoLevel < 1))
        return `Invalid hero level \`${geraldoLevel}\` provided!\nHero level must be from \`1\` to \`20\` (inclusive)`;
}

async function embedBloonology(itemName, level) {
    let res = '';

    try {
        res = await axios.get('https://pastebin.com/raw/rksZWhTV');
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }
    
    const body = res.data;
    const cleaned = body.replace(/\t/g, '').replace(/\r/g, '').trim();
    const sentences = cleaned.split(/\n\n/);

    const desc = level ? sentences[level - 1] : sentences[sentences.length - 1].trim();
    const descWithoutLevel = desc.split('\n').slice(5);
    const descWithoutChanges = descWithoutLevel.slice(0, descWithoutLevel.indexOf(' '));
    let item;
    descWithoutChanges.indexOf("## " + items[items.indexOf(itemName)+1]) === -1 ? 
    item = descWithoutChanges.slice(descWithoutChanges.indexOf("## " + itemName)).join('\n') 
    : item = descWithoutChanges.slice(descWithoutChanges.indexOf("## " + itemName), descWithoutChanges.indexOf("## " + items[items.indexOf(itemName)+1])).join('\n');

    if(descWithoutChanges.join('\n').includes(itemName) == false){
        return new Discord.EmbedBuilder().setColor(red).setTitle('Geraldo does not have this item at the current level, please try again.');
    }

    if (typeof desc != 'string') {
        return new Discord.EmbedBuilder().setColor(red).setTitle('The bloonology datapiece is missing');
    }

    const title = `${Aliases.toIndexNormalForm(itemName)} (Level-${level})`;

    const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(item)
        .setColor(cyber)
        .setFooter({ text: footer });
    return embed;
}

async function execute(interaction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure) {
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    const itemName = interaction.options.getString('item');
    const geraldoLevel = interaction.options.getInteger('geraldo_lvl');

    const embed = await embedBloonology(itemName, geraldoLevel);

    return await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};
