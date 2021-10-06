const { DiscordAPIError } = require('discord.js');
const { cyber, palepurple } = require('../jsons/colours.json');

module.exports = {
    name: 'jointhread',
    aliases: ['join', 'th', 'tread'],
    rawArgs: true,
    async execute(message, args, commandName) {
        if (args.length == 0 || args[0] == 'help')
            return module.exports.helpMessage(message);
        let threadName = message.content.slice(3 + commandName.length);
        console.log(threadName);
        let thread = message.channel.threads.cache.find((x) =>
            x.name.includes(threadName)
        );
        if (!thread) return message.channel.send('Thread doesnt exist');
        if (thread.joinable) {
            await thread.join();
            return message.channel.send({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(palepurple)
                        .setDescription(`joined thread ${thread.name}`),
                ],
            });
        } else return message.channel.send('thread is not joinable');
    },
    helpMessage(message) {
        let embed = new Discord.MessageEmbed()
            .setColor(palepurple)
            .setDescription(
                '*usage*:\n`q!jointhread <threadname>` - q!jointhread bot-discussion'
            );
        return message.channel.send({ embeds: [embed] });
    },
};
