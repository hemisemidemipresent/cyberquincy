const quiz = require('../jsons/quiz.json');
const { cyber, orange, turq, magenta } = require('../jsons/colours.json');
const { MessageActionRow, MessageButton } = require('discord.js');
const { discord } = require('../aliases/misc.json');
const Quiz = require('../helpers/quiz.js');
let numbers = [0, 1, 2, 3];
const emojis = [
    ':regional_indicator_a:',
    ':regional_indicator_b:',
    ':regional_indicator_c:',
    ':regional_indicator_d:',
];

const time = 10000;
let item;

module.exports = {
    name: 'quiz',
    execute(message) {
        const filter = (i) => i.user.id == message.author.id;

        item = quiz[Math.floor(Math.random() * quiz.length)];
        options = item.optns;

        shuffle(numbers);

        const buttons = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(numbers[0].toString())
                .setLabel('A')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId(numbers[1].toString())
                .setLabel('B')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId(numbers[2].toString())
                .setLabel('C')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId(numbers[3].toString())
                .setLabel('D')
                .setStyle('PRIMARY')
        );

        let string = '';
        for (let i = 0; i < 4; i++) {
            let rand = numbers[i];
            string += `${emojis[i]} ${options[rand]}\n`;
        }

        let QuestionEmbed = new Discord.MessageEmbed()
            .setTitle(`${item.question}`)
            .addField('options', string)
            .addField(
                'please contribute',
                `join [this server](${discord}) to suggest a question`
            )
            .setColor(cyber);

        message.reply({ embeds: [QuestionEmbed], components: [buttons] });

        const collector = message.channel.createMessageComponentCollector({
            filter,
            time: time,
        });
        collector.on('collect', async (i) => {
            let embed = process(i, message.author.id);
            return i.update({ embeds: [embed], components: [] });
        });
        collector.on('end', (collected) => {
            if (!collected.first()) {
                let errorEmbed = new Discord.MessageEmbed()
                    .setTitle(`Game over! You took too long.`)
                    .setColor(magenta);
                return message.channel.send({ embeds: [errorEmbed] });
            }
        });
    },
};
function process(interaction, userID) {
    let id = parseInt(interaction.customId);
    if (item.ans == id) {
        Quiz.answerCorrect(userID);
        let streak = Quiz.getStreak(userID);
        let correctEmbed = new Discord.MessageEmbed()
            .setTitle('Congratulations! You got the correct answer!')
            .setDescription(streak)
            .setColor(turq)
            .setFooter(
                'streak will not be carried over when the bot restarts and that might happen randomly.'
            );
        return correctEmbed;
    } else {
        Quiz.answerWrong(userID);
        let streak = Quiz.getStreak(userID);

        let wrongEmbed = new Discord.MessageEmbed()
            .setTitle('Game over! You got the wrong answer!')
            .setDescription(streak)
            .addField('answer', `||${item.optns[item.ans]}||`)
            .setColor(orange)
            .setFooter(
                'streak will not be carried over when the bot restarts and that might happen randomly.'
            );

        return wrongEmbed;
    }
}
// I have no idea how this works dont ask me I just copied this from stackoverflow and it just works
function shuffle(array) {
    var currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}
