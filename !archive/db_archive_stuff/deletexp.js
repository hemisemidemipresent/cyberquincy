module.exports = {
    name: 'deletexp',

    aliases: ['delxp', 'dxp', 'resetxp', 'reset'],

    async execute(message, args) {
        if (!args[0] || args[0] != 'confirm') {
            return module.exports.helpMessage(message);
        }

        let data = await Tags.destroy({
            where: { name: message.author.id }
        });
        if (data) return message.channel.send(`Your xp is now 0. I don't know why you did that.`);
        else return message.channel.send('I dont have any data stored of you!');
    },

    helpMessage(message) {
        return message.channel.send(
            'Type `q!deletexp confirm` to delete your own xp. This cannot be undone'
        );
    }
};
