module.exports = {
    name: 'ping',
    aliases: ['pong'],
    async execute(message) {
        const responseTime = Math.round(Date.now() - message.createdTimestamp); // This will round the response time between when the message was received and when the message was sent
        await message.channel.send(
            `Pong! (pong is the standard response)\nResponse Time: \`${responseTime}ms\`\nActually this is the receiving time from when you pressed your send button to the time the bot receives, parses, and process your message, it does not account for the time taken for the bot to tell Discord, or Discord's own time, or your internet`
        );
    },
};
