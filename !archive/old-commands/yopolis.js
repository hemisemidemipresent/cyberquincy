const { cyber, red } = require('../jsons/colours.json');
const CashParser = require('../parser/cash-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
const AnyOrderParser = require('../parser/any-order-parser');

module.exports = {
    name: 'monkeyopolis',
    aliases: ['mp', 'yopolis', '005'],
    async execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(new CashParser(), new NaturalNumberParser(1, 69))
        );
        if (parsed.hasErrors()) {
            return await module.exports.errorMessage(message.channel, parsed.parsingErrors);
        }
        let farmcount = parsed.natural_number;
        let amtSacrificed = parsed.cash;
        const money = 300 * Math.floor(amtSacrificed / 2000);
        const price = farmcount * 5000;
        const even = Math.ceil(price / money);
        const mpembed = new Discord.EmbedBuilder()
            .setTitle('Monkeyopolis Simulator')
            .setColor(cyber)
            .addField('amount sacrificed', `${amtSacrificed}`)
            .addField('farms sacrificed', `${farmcount}`)
            .addField('Money produced in a round', `${money}`, true)
            .addField('cost of upgrade', `${price}`, true)
            .addField('rounds until breaking even', `${even}`, true);
        await message.channel.send({ embeds: [mpembed] });
    },
    async errorMessage(channel, parsingErrors) {
        const errorEmbed = new Discord.EmbedBuilder()
            .setTitle('ERROR')
            .addField('Likely Cause(s)', parsingErrors.map((msg) => ` • ${msg}`).join('\n'), true)
            .addField('usage', 'q!yopolis <total amount sacrified> <farm count>', true)
            .addField('example', 'q!yopolis 50000 2', true)
            .setColor(red);
        await channel.send({ embeds: [errorEmbed] });
    }
};
