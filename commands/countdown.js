module.exports = {
    name: 'seclate',
    aliases: ['sec', 'time', 'racing'],
    execute(message, args, client) {
        let comesBack = new Date('06/22/2020');
        let now = new Date();
        console.log(comesBack);
        console.log(now);
        let differenceInTime = comesBack.getTime() - now.getTime();
        let differenceInDays = differenceInTime / (1000 * 3600 * 24);
        message.channel.send(
            `${differenceInDays} days left until seclate comes back`
        );
    },
};
