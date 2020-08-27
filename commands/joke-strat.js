module.exports = {
    name: 'strat',
    aliases: ['how', 'howtogetgoodtime'],
    description: 'calculates the health of blimps, even in freeplay',
    execute(message) {
        return message.channel.send(
            "Send faster, pop more Bloons, end more rounds, don't die"
        );
    },
};
