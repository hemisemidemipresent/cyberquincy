const { SlashCommandBuilder } = require('@discordjs/builders');

builder = new SlashCommandBuilder().setName('woor').setDescription('Ace micro term: Wiggle out of range');

async function execute(interaction) {
    return await interaction.reply({
        content:
            "**woor** (short for _wiggle out of range_) is an ace micro technique discovered by e_to_the_pi_i. it basically makes your ace fly away from the pad in a straight line as far as more than twice the radius of figure circle without the need of centered path. https://youtu.be/o5muYjZRAsc is an example of a woor. more interestingly, the woor works in every single direction as long as the user errorn't controls it correctly.\nhow it works: by alternating between tab and reverse tab in a consistent rhythm, you make the ace turn left and right and repeat, allowing it to move forward"
    });
}

module.exports = {
    data: builder,
    execute
};
