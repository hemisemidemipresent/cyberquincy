module.exports = {
    name: 'ping',
    async execute(message) {
        const responseTime = Math.round(Date.now() - message.createdTimestamp); // This will round the response time between when the message was received and when the message was sent
        await message.channel.send(
            `Pong! (pong is the standard response)\nResponse Time: \`${responseTime}ms\``
        );
    },
};
