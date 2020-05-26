const Discord = require('discord.js');
const quiz = require('../jsons/quiz.json');
const { colour } = require('../shh/config.json');
module.exports = {
    name: 'quiz',
    execute(message, args, client) {
        const item = quiz[Math.floor(Math.random() * quiz.length)];
        //for unkeyed {}s, just [index]
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
                'join [this server](https://discord.gg/VMX5hZA) to suggest an idea, as well as get the lastest updates, bug fixes and reports.'
            )
            .setFooter(
                'This command is unstable and dont expect it to be 100% working'
            )
            .setColor(colour);
        const filter = (msg) => msg.author.id === `${message.author.id}`;
        message.channel.send(QuestionEmbed).then(() => {
            message.channel
                .awaitMessages(filter, {
                    max: 1,
                    time: 10000,
                    errors: ['time'],
                })
                .then((collected) => {
                    if (
                        item.answers.toLowerCase() ===
                        collected.first().content.toLowerCase()
                    ) {
                        let correctEmbed = new Discord.MessageEmbed()
                            .setTitle(
                                'Congratulations! You got the correct answer!'
                            )
                            .setColor('#00ff69');
                        message.channel.send(correctEmbed);
                    } else {
                        let wrongEmbed = new Discord.MessageEmbed()
                            .setTitle('Game over! You got the wrong answer!')
                            .setColor('#ff6900');
                        message.channel.send(wrongEmbed);
                    }
                })
                .catch((collected) => {
                    let errorEmbed = new Discord.MessageEmbed()
                        .setTitle(`Game over! You took too long.`)
                        .setColor('#ff0069');
                    message.channel.send();
                });
        });
    },
};
