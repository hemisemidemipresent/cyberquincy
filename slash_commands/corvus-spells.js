const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

const axios = require('axios');
const { footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colors.json');
const { SlashCommandIntegerOption } = require('@discordjs/builders');


const spells10 = ['Spear', 'Aggression', 'Malevolence', 'Storm', 'Repel', 'Echo', 'Haste', 'Trample', 'Frostbound', 'Ember', 'Ancestral Might', 'Nourishment', 'Soul Barrier', 'Vision', 'Recovery'];
const spells13 = ['Spear', 'Aggression', 'Malevolence', 'Storm', 'Repel', 'Echo', 'Haste', 'Trample', 'Frostbound', 'Ember', 'Ancestral Might', 'Overload', 'Nourishment', 'Soul Barrier', 'Vision', 'Recovery'];

const spellOptions = new SlashCommandStringOption()
    .setName('spell')
    .setDescription('Corvus\'s spell that you are looking for information on')
    .setRequired(true);
    spells13.forEach(spell => {spellOptions.addChoices({ name: Aliases.toIndexNormalForm(spell), value: spell });
});

const builder = new SlashCommandBuilder()
    .setName('corvusgrimoire')
    .setDescription('Find Information on Corvus\' spells')
    .addStringOption(spellOptions)
    .addIntegerOption((option) =>
        option.setName('corvus_lvl').setDescription('The Corvus level that you want the information for').setRequired(true)
    );

function validateInput(interaction) {
    const corvusLevel = interaction.options.getInteger('corvus_lvl');
    if (corvusLevel && (corvusLevel > 20 || corvusLevel < 1))
        return `Invalid hero level \`${corvusLevel}\` provided!\nHero level must be from \`1\` to \`20\` (inclusive)`;
}

async function embedBloonology(spellName, level) {
    let res = '';

    try {
        res = await axios.get('https://pastebin.com/raw/JVnXdsqZ');
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }

    
    let spells = [];
    level == 1 ? spells = spells13.slice(0,1).concat(spells13.slice(4,5)).concat(spells13.slice(12,13))
    : (level > 1 && level < 4) ? spells = spells13.slice(0,1).concat(spells13.slice(4,7)).concat(spells13.slice(12,13))
    : level == 4 ? spells = spells13.slice(0,1).concat(spells13.slice(4,8)).concat(spells13.slice(12,14))
    : level == 5 ? spells = spells13.slice(0,2).concat(spells13.slice(4,9)).concat(spells13.slice(12,15))
    : level == 6 ? spells = spells13.slice(0,2).concat(spells13.slice(4,10)).concat(spells13.slice(12,15))
    : level == 7 ? spells = spells13.slice(0,3).concat(spells13.slice(4,11)).concat(spells13.slice(12,15))
    : (level > 7 && level < 10) ? spells = spells13.slice(0,11).concat(spells13.slice(12,15))
    : (level > 9 && level < 13) ? spells = spells13.slice(0,11).concat(spells13.slice(12,16))
    : (level > 12 && level < 21) ? spells = spells13 : spells = 'hi :)';

    const body = res.data;
    const cleaned = body.replace(/\t/g, '').replace(/\r/g, '').trim();
    const sentences = cleaned.split(/\n\n/);

    const desc = level ? sentences[level - 1] : sentences[sentences.length - 1].trim();
    const descWithoutLevel = desc.split('\n').slice(10);
    const descWithoutChanges = descWithoutLevel.slice(0, descWithoutLevel.indexOf(' '));
    const descWithoutAbilities = descWithoutChanges.slice(0,descWithoutChanges.indexOf('# Activated Abilities'));

    let spell;
    if(level < 3){
        descWithoutChanges.indexOf("## " + spells[spells.indexOf(spellName)+1]) === -1 ? 
        spell = descWithoutChanges.slice(descWithoutChanges.indexOf("## " + spellName)).join('\n') 
        : spell = descWithoutChanges.slice(descWithoutChanges.indexOf("## " + spellName), descWithoutChanges.indexOf("## " + spells[spells.indexOf(spellName)+1])).join('\n');
    } else {
        descWithoutAbilities.indexOf("## " + spells[spells.indexOf(spellName)+1]) === -1 ? 
        spell = descWithoutAbilities.slice(descWithoutAbilities.indexOf("## " + spellName)).join('\n') 
        : spell = descWithoutAbilities.slice(descWithoutAbilities.indexOf("## " + spellName), descWithoutAbilities.indexOf("## " + spells[spells.indexOf(spellName)+1])).join('\n');
    }
    console.log(descWithoutChanges);
    console.log(descWithoutAbilities);
    console.log(descWithoutChanges.indexOf("## " + spells[spells.indexOf(spellName)+1]))

    if(descWithoutChanges.join('\n').includes(spellName) == false){
        return new Discord.EmbedBuilder().setColor(red).setTitle('Corvus does not have this spell at the current level, please try again.');
    }

    if (typeof desc != 'string') {
        return new Discord.EmbedBuilder().setColor(red).setTitle('The bloonology datapiece is missing');
    }

    const title = `${Aliases.toIndexNormalForm(spellName)} (Level-${level})`;

    const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(spell)
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

    const spellName = interaction.options.getString('spell');
    const corvusLevel = interaction.options.getInteger('corvus_lvl');

    const embed = await embedBloonology(spellName, corvusLevel);

    return await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};
