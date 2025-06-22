const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

// const { shuffle } = require('../helpers/general');

const quiz = require('../jsons/quiz.json');
const Quiz = require('../helpers/quiz.js');

const { cyber, orange, turq } = require('../jsons/colors.json');
const { discord } = require('../aliases/misc.json');

let numbers = [0, 1, 2, 3];
const emojis = [':regional_indicator_a:', ':regional_indicator_b:', ':regional_indicator_c:', ':regional_indicator_d:'];
const CORRECT_EMOJI = ':white_check_mark:';
const WRONG_EMOJI = ':x:';

builder = new SlashCommandBuilder().setName('quiz').setDescription('test your knowledge in all things bloons-related');

async function execute(interaction) {
    await loadQuestion(interaction);
}

async function loadQuestion(interaction) {
    const id = Math.floor(Math.random() * quiz.length);
    item = quiz[id];
    options = item.optns;

    // numbers = shuffle(numbers); // randomize the order of the options - sometimes the answers should be in a specific order so it would be weird if it was randomized

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
        .setColor(cyber)
        .setFooter({ text: JSON.stringify({ id }) });

    const response = await interaction.reply({
        embeds: [QuestionEmbed],
        components: [buttons],
        withResponse: true
    });

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
        await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', embeds: [], components: [] });
    }
}

async function onButtonClick(interaction) {
    if (interaction.customId === 'playagain') {
        return await loadQuestion(interaction);
    }

    if (interaction.user.id !== interaction.message.interaction.user.id) return; // someone else pressed the button

    const id = interaction.customId;
    const userID = interaction.user.id;

    const question = JSON.parse(interaction.message.embeds[0].data.footer.text);
    questionId = question.id;
    const item = quiz[questionId];

    const userOption = item.optns[id];
    const correctOption = item.optns[item.ans];
    const answerText = item.optns.map((opt, index) => {
        let line = `${emojis[index]} ${opt} `;
        if (opt === correctOption) {
            line += CORRECT_EMOJI;
        } else if (opt === userOption) {
            line += WRONG_EMOJI;
        }
        return line + '\n';
    });
    
    if (item.ans == id) {
        Quiz.answerCorrect(userID);
        let streak = Quiz.getStreak(userID);
        let correctEmbed = new Discord.EmbedBuilder()
            .setTitle('Congratulations! You got the correct answer!')
            .setDescription(
                `${streak}\nNOTE: streak will not be carried over when the bot restarts and that might happen randomly.`
            )
            .addFields([{ name: item.question, value: `||${answerText.join('')}||` }])
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
            .addFields([{ name: item.question, value: `||${answerText.join('')}||` }])
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
