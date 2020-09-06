module.exports = {
    name: 'server',

    execute(message) {
        if (message.author.id == '668312965664997386') {
            return message.channel.send(
                "You have been banned from using this command because\n1. you ruin the reputation of the server by spam pinging people\n2. the bot doesn't like people spamming commands\n3. You may have alts to circumvent this, but honestly you should just learn your mistakes. You had your chance."
            );
        }
        return message.channel.send(
            'Join this discord server to get notifications on bot updates, downtime, report bugs and to suggest features: https://discord.gg/VMX5hZA'
        );
    },
};
