const { cyber, red } = require('../jsons/colours.json');
const CashParser = require('../parser/cash-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
const AnyOrderParser = require('../parser/any-order-parser');

module.exports = {
    name: 'monkeyopolis',
    aliases: ['mp', 'yopolis', '005'],
    execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new AnyOrderParser(new CashParser(), new NaturalNumberParser(1, 69))
        );
        if (parsed.hasErrors()) {
            return module.exports.errorMessage(
                message.channel,
                parsed.parsingErrors
            );
        }
        let farmcount = parsed.natural_number;
        let amtSacrificed = parsed.cash;
        const money = 300 * Math.floor(amtSacrificed / 2000);
        const price = farmcount * 5000;
        const even = Math.ceil(price / money);
        const mpembed = new Discord.MessageEmbed()
            .setTitle('Monkeyopolis Simulator')
            .setColor(cyber)
            .addField('amount sacrificed', `${amtSacrificed}`)
            .addField('farms sacrificed', `${farmcount}`)
            .addField('Money produced in a round', `${money}`, true)
            .addField('cost of upgrade', `${price}`, true)
            .addField('rounds until breaking even', `${even}`, true);
        message.channel.send(mpembed);
    },
    errorMessage(channel, parsingErrors) {
        const errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n'),
                true
            )
            .addField(
                'usage',
                'q!yopolis <farm count> <total amount sacrified>',
                true
            )
            .addField('example', 'q!yopolis 50000 2', true)
            .setColor(red);
        channel.send(errorEmbed);
    },
};
