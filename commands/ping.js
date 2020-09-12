module.exports = {
    name: 'ping',
    description: 'ping',
    execute(message, args) {
        const responseTime = Math.round(Date.now() - message.createdTimestamp); // This will round the response time between when the message was received and when the message was sent
        message.channel.send(
            `Pong! (pong is the standard response)\nResponse Time: \`${responseTime}ms\``
        );
    },
};
