const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

const { shuffle } = require('../helpers/general');

const quiz = require('../jsons/quiz.json');
const Quiz = require('../helpers/quiz.js');

const { cyber, orange, turq } = require('../jsons/colors.json');
const { discord } = require('../aliases/misc.json');

let numbers = [0, 1, 2, 3];
const emojis = [':regional_indicator_a:', ':regional_indicator_b:', ':regional_indicator_c:', ':regional_indicator_d:'];

builder = new SlashCommandBuilder().setName('quiz').setDescription('test your knowledge in all things bloons-related');

async function execute(interaction) {
    await loadQuestion(interaction);
}

async function loadQuestion(interaction) {
    item = quiz[Math.floor(Math.random() * quiz.length)];
    module.exports.item = item;
    options = item.optns;

    shuffle(numbers);

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(numbers[0].toString()).setLabel('A').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(numbers[1].toString()).setLabel('B').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(numbers[2].toString()).setLabel('C').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(numbers[3].toString()).setLabel('D').setStyle(ButtonStyle.Primary)
    );

    let string = '';
    for (let i = 0; i < 4; i++) {
        let rand = numbers[i];
        string += `${emojis[i]} ${options[rand]}\n`;
    }

    let QuestionEmbed = new Discord.EmbedBuilder()
        .setTitle(`${item.question}`)
        .addFields([
            { name: 'options', value: string },
            { name: 'please contribute', value: `join [this server](${discord}) to suggest a question` }
        ])
        .setColor(cyber);

    await interaction.reply({
        embeds: [QuestionEmbed],
        components: [buttons]
    });
}

async function onButtonClick(interaction) {
    if (interaction.customId === 'playagain') {
        return await loadQuestion(interaction);
    }

    const id = interaction.customId;
    const userID = interaction.user.id;
    const item = module.exports.item;

    if (item.ans == id) {
        Quiz.answerCorrect(userID);
        let streak = Quiz.getStreak(userID);
        let correctEmbed = new Discord.EmbedBuilder()
            .setTitle('Congratulations! You got the correct answer!')
            .setDescription(
                `${streak}\nNOTE: streak will not be carried over when the bot restarts and that might happen randomly.`
            )
            .setColor(turq)
            .setFooter({ text: 'run /quiz again to play again' });
        await interaction.update({ embeds: [correctEmbed], components: [] });
    } else {
        Quiz.answerWrong(userID);
        let streak = Quiz.getStreak(userID);

        let wrongEmbed = new Discord.EmbedBuilder()
            .setTitle('Game over! You got the wrong answer!')
            .setDescription(
                `${streak}\nNOTE: streak will not be carried over when the bot restarts and that might happen randomly.`
            )
            .addFields([{ name: 'answer', value: `||${item.optns[item.ans]}||` }])
            .setColor(orange)
            .setFooter({ text: 'run /quiz again to play again' });

        await interaction.update({ embeds: [wrongEmbed], components: [] });
    }
}
module.exports = {
    data: builder,
    execute,
    onButtonClick,
    item: undefined
};
