const embed1 = new Discord.MessageEmbed().setTitle('Embed 1');
const embed2 = new Discord.MessageEmbed().setTitle('Embed 2');
const embed3 = new Discord.MessageEmbed().setTitle('Embed 3');
const embed4 = new Discord.MessageEmbed().setTitle('Embed 4');
const embed5 = new Discord.MessageEmbed().setTitle('Embed 5');
const embed6 = new Discord.MessageEmbed().setTitle('Embed 6');
const embed7 = new Discord.MessageEmbed().setTitle('Embed 7');
const embedArr = [embed1, embed2, embed3, embed4, embed5, embed6, embed7];
let pagenumber = 1;

module.exports = {
    name: 'test',
    aliases: ['beta'],

    async execute(message) {
        message.channel.send(embed1).then((msg) => {
            main(msg);
        });
        function reactMsg(msg) {
            msg.react('➡️');
            msg.react('❌');
        }
        function main(msg) {
            reactMsg(msg);
            const collector = msg
                .createReactionCollector(
                    (reaction, user) =>
                        user.id === message.author.id &&
                        (reaction.emoji.name == '⬅️' ||
                            reaction.emoji.name == '➡️' ||
                            reaction.emoji.name == '❌'),
                    { time: 20000 }
                )
                .once('collect', (reaction) => {
                    let chosen = reaction.emoji.name;
                    if (chosen == '❌') {
                        return msg.delete();
                    } else if (chosen == '⬅️' && pagenumber > 1) {
                        pagenumber--;
                    } else if (chosen == '➡️' && pagenumber < embedArr.length) {
                        pagenumber++;
                    } else {
                        return;
                    }
                    show(pagenumber);
                    collector.stop();
                });
        }
        function show(pagenumber) {
            message.channel.send(embedArr[pagenumber - 1]).then((msg) => {
                main(msg);
            });
        }
    },
};
