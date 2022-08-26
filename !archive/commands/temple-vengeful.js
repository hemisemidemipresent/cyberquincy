module.exports = {
    name: 'vtsg',
    aliases: ['555'],
    async execute(message) {
        await message.channel.send(
            '555 super monkey has the following buffs compared to a TSG (use q!temple):\n• sunblast buffed: +25d\nall other attacks (including subtowers) buffed: ×2d (applied after additive buffs)'
        );
    },
};
