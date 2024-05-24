const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

const { HERO_NAME_TO_BLOONOLOGY_LINK } = require('../helpers/heroes');
const shop = ['Shooty Turret', 'Stack of Old Nails', 'Creepy Idol', 'Jar of Pickles', 'Rare Quincy Action Figure', 'See Invisibility Potion', 'Tube of Amaz-o-Glue', 'Sharpening Stone', 'Worn Hero\'s Cape', 'Blade Trap', 'Bottle of \'Gerry\'s Fire\' Hot Sauce', 'Fertilizer', 'Pet Bunny', 'Rejuv Potion', 'Genie Bottle', 'Paragon Power Totem'];
const spellbook = ['Spear', 'Aggression', 'Malevolence', 'Storm', 'Repel', 'Echo', 'Haste', 'Trample', 'Frostbound', 'Ember', 'Ancestral Might', 'Overload', 'Nourishment', 'Soul Barrier', 'Vision', 'Recovery'];

const axios = require('axios');
const { footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colors.json');

const heroOption = new SlashCommandStringOption()
    .setName('hero')
    .setDescription('The hero you are finding information for')
    .setRequired(true);
Object.keys(HERO_NAME_TO_BLOONOLOGY_LINK).forEach((hero) => {
    heroOption.addChoices({ name: Aliases.toIndexNormalForm(hero), value: hero });
});

const itemOptions = new SlashCommandStringOption()
    .setName('item')
    .setDescription('Geraldo\'s Shop Item that you are looking for information on')
    .setRequired(true);

shop.forEach(item => {
    itemOptions.addChoices({ name: Aliases.toIndexNormalForm(item), value: item });
});

const spellOptions = new SlashCommandStringOption()
    .setName('spell')
    .setDescription('Corvus\'s spell that you are looking for information on')
    .setRequired(true);

spellbook.forEach(spell => {
    spellOptions.addChoices({ name: Aliases.toIndexNormalForm(spell), value: spell });
}
);

const builder = new SlashCommandBuilder()
    .setName('hero')
    .setDescription('hi :3')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('heroes')
            .setDescription('Find information for each hero')
            .addStringOption(heroOption)
            .addIntegerOption((option) =>
                option.setName('hero_lvl').setDescription('The hero level that you want the information for').setRequired(false)
            )
    ).addSubcommand((subcommand) =>
        subcommand
            .setName('geraldo')
            .setDescription('Find Information on Geraldo\'s shop items')
            .addStringOption(itemOptions)
            .addIntegerOption((option) =>
                option.setName('hero_lvl').setDescription('The Geraldo level that you want the information for').setRequired(true)
            )
    ).addSubcommand((subcommand) =>
        subcommand
            .setName('corvus')
            .setDescription('Find Information on Corvus\' spells')
            .addStringOption(spellOptions)
            .addIntegerOption((option) =>
                option.setName('hero_lvl').setDescription('The Corvus level that you want the information for').setRequired(true)
            )
    );

function validateInput(interaction) {
    const heroLevel = interaction.options.getInteger('hero_lvl');
    if (heroLevel && (heroLevel > 20 || heroLevel < 1))
        return `Invalid hero level \`${heroLevel}\` provided!\nHero level must be from \`1\` to \`20\` (inclusive)`;
}

async function embedBloonology(heroName, level, heroItem, heroSpell, interaction) {
    const link = HERO_NAME_TO_BLOONOLOGY_LINK[heroName];
    let res = '';

    try {
        res = await axios.get(link);
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }

    const body = res.data;
    const cleaned = body.replace(/\t/g, '').replace(/\r/g, '').trim();
    const sentences = cleaned.split(/\n\n/);

    const desc = level ? sentences[level - 1] : sentences[sentences.length - 1].trim();

    let descWithoutLevel, descWithoutChanges = [], descWithoutAbilities = [];

    if (interaction.options.getSubcommand() === 'geraldo') {
        descWithoutLevel = desc.split('\n').slice(5);
    } else if (interaction.options.getSubcommand() === 'corvus'){
        descWithoutLevel = desc.split('\n').slice(10);
    } else {
        descWithoutLevel = desc.split('\n').slice(1).join('\n');
    }

    //removing this causes errors
    if(level){
        descWithoutChanges = descWithoutLevel.slice(0, descWithoutLevel.indexOf(' '))
        descWithoutAbilities = descWithoutChanges.slice(0, descWithoutChanges.indexOf('# Activated Abilities'));
    }
    
    if (interaction.options.getSubcommand() === 'geraldo' && descWithoutChanges.join('\n').includes(heroItem) == false) {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Geraldo does not have this item at the current level, please try again.');
    }

    if (interaction.options.getSubcommand() === 'corvus' && descWithoutChanges.join('\n').includes(heroSpell) == false) {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Corvus does not have this spell at the current level, please try again.');
    }


    // hemi: ngl I'm not sure what sort of indexing is going on in these a, b, c, d, e, f variables are from alexmi but im just gonna leave them there
    //geraldo
    let item;
    if (descWithoutChanges.indexOf("## " + shop[shop.indexOf(heroItem) + 1]) === -1) {
	    item = descWithoutChanges.slice(descWithoutChanges.indexOf("## " + heroItem)).join('\n')
    } else {
	    item = descWithoutChanges.slice(descWithoutChanges.indexOf("## " + heroItem), descWithoutChanges.indexOf("## " + shop[shop.indexOf(heroItem) + 1])).join('\n');
    }

    //corvus
    let spells = [], spell;

    if (level == 1)
        spells = spellbook.slice(0, 1).concat(spellbook.slice(4, 5)).concat(spellbook.slice(12, 13));
    else if (level == 2 || level == 3)
        spells = spellbook.slice(0, 1).concat(spellbook.slice(4, 7)).concat(spellbook.slice(12, 13));
    else if (level == 4)
        spells = spellbook.slice(0, 1).concat(spellbook.slice(4, 8)).concat(spellbook.slice(12, 14));
    else if (level == 5)
        spells = spellbook.slice(0, 2).concat(spellbook.slice(4, 9)).concat(spellbook.slice(12, 15));
    else if (level == 6)
        spells = spellbook.slice(0, 2).concat(spellbook.slice(4, 10)).concat(spellbook.slice(12, 15));
    else if (level == 7)
        spells = spellbook.slice(0, 3).concat(spellbook.slice(4, 11)).concat(spellbook.slice(12, 15));
    else if (level == 8 || level == 9)
        spells = spellbook.slice(0, 11).concat(spellbook.slice(12, 15));
    else if (level == 10 || level == 11 || level == 12)
        spells = spellbook.slice(0, 11).concat(spellbook.slice(12, 16));
    else if (level >= 13)
        spells = spellbook;

    //ignore hero abilities once they start existing
    if (level < 3) {
        if (descWithoutChanges.indexOf("## " + spells[spells.indexOf(heroSpell) + 1]) === -1) {
            spell = descWithoutChanges.slice(descWithoutChanges.indexOf("## " + heroSpell)).join('\n')
        } else {
            spell = descWithoutChanges.slice(descWithoutChanges.indexOf("## " + heroSpell), descWithoutChanges.indexOf("## " + spells[spells.indexOf(heroSpell) + 1])).join('\n');
        }
    } else {
        if (descWithoutAbilities.indexOf("## " + spells[spells.indexOf(heroSpell) + 1]) === -1) {
            descWithoutAbilities.slice(descWithoutAbilities.indexOf("## " + heroSpell)).join('\n')
        } else {
            descWithoutAbilities.slice(descWithoutAbilities.indexOf("## " + heroSpell), descWithoutAbilities.indexOf("## " + spells[spells.indexOf(heroSpell) + 1])).join('\n');
        }
    }

    if (typeof desc != 'string') {
        return new Discord.EmbedBuilder().setColor(red).setTitle('The bloonology datapiece is missing');
    }

    let title;
    if (interaction.options.getSubcommand() === 'geraldo'){
        title = `${Aliases.toIndexNormalForm(heroItem)} (Level-${level})`;
    } else if (interaction.options.getSubcommand() === 'corvus'){
        title = `${Aliases.toIndexNormalForm(heroSpell)} (Level-${level})`;
    } else{
        level ? title = `${Aliases.toIndexNormalForm(heroName)} (Level-${level})` : title = `${Aliases.toIndexNormalForm(heroName)} (All Levels)`;
    }

    // overflow
    // TODO: Check for total chars > 6000
    let fields = [];
    let descForDescription = '';
    if (descWithoutLevel.length > 4096) {
        const descLines = descWithoutLevel.split('\n');
        descLines.forEach((line) => {
            // add to description until char limit is reached
            if (descForDescription.length + line.length < 4096)
                return descForDescription += line + '\n';

            // (assuming fields array is not empty) add to value of latest field
            if (fields[0] && fields[fields.length - 1].value.length + line.length < 1024)
                return fields[fields.length - 1].value += line + '\n';

            fields.push({ name: '\u200b', value: line + '\n' });
        });
    } else {
        if (interaction.options.getSubcommand() === 'geraldo'){
            descForDescription = item;
        } else if (interaction.options.getSubcommand() === 'corvus'){
            descForDescription = spell;
        } else {
            descForDescription = descWithoutLevel;
        }
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(descForDescription)
        .addFields(fields)
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

    let heroName = interaction.options.getString('hero');
    if (interaction.options.getSubcommand() === 'geraldo') heroName = 'geraldo';
    if (interaction.options.getSubcommand() === 'corvus') heroName = 'corvus';
    const heroLevel = interaction.options.getInteger('hero_lvl');
    const heroItem = interaction.options.getString('item');
    const heroSpell = interaction.options.getString('spell');
    const embed = await embedBloonology(heroName, heroLevel, heroItem, heroSpell, interaction);

    return await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};
