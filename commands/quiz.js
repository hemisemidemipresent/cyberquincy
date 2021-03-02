const quiz = require('../jsons/quiz.json');
const { cyber, orange, turq, magenta } = require('../jsons/colours.json');
const { discord } = require('../aliases/misc.json');
const Quiz = require('../helpers/quiz.js');
let item;

module.exports = {
    name: 'quiz',
    execute(message) {
        item = quiz[Math.floor(Math.random() * quiz.length)];
        let QuestionEmbed = new Discord.MessageEmbed()
            .setTitle(`${item.question}`)
            .setDescription(
                'type the option **letter** in chat, you will be given **10** seconds.'
            )
            .addField(
                'options',
                `A) ${item.optns[0]}\nB) ${item.optns[1]}\nC) ${item.optns[2]}\nD) ${item.optns[3]}`
            )
            .addField(
                'people **HAVE** contributed to this command!',
                `join [this server](${discord}) to suggest an idea, as well as get the lastest updates, bug fixes and reports.`
            )
            .setColor(cyber);

        const filter = (msg) => msg.author.id === `${message.author.id}`;

        message.channel.send(QuestionEmbed).then(() => {
            message.channel
                .awaitMessages(filter, {
                    max: 1,
                    time: 10000,
                    errors: ['time'],
                })
                .then((collected) => {
                    let embed = process(collected, message.author.id);
                    message.channel.send(embed);
                })
                .catch((err) => {
                    let errorEmbed = new Discord.MessageEmbed()
                        .setTitle(`Game over! You took too long.`)
                        .setColor(magenta);
                    message.channel.send(errorEmbed);
                    console.log(err);
                });
        });
    },
};
function process(collected, userID) {
    if (
        item.answers.toLowerCase() === collected.first().content.toLowerCase()
    ) {
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
            .setColor(orange)
            .setFooter(
                'streak will not be carried over when the bot restarts and that might happen randomly.'
            );

        return wrongEmbed;
    }
}
