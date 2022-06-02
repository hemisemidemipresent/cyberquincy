const TempleSetParser = require('../parser/temple-set-parser');
const OptionalParser = require('../parser/optional-parser');
const CashParser = require('../parser/cash-parser');
const AnyOrderParser = require('../parser/any-order-parser');
const OrParser = require('../parser/or-parser');

const t = require('../jsons/temple.json');
const t2 = require('../jsons/temple2.json'); // TSG variants

const titles = ['Primary sacrifice', 'Military sacrifice', 'Magic sacrifice', 'Support sacrifice'];

const { yellow } = require('../jsons/colours.json');

module.exports = {
    name: 'temple',
    aliases: ['t', 'tsg', 'sg', 'monkeygod', 'god', 'totmg', 'vtsg'],
    async execute(message, args) {
        return await message.channel.send(
            'Please use `/temple` instead.\nIf this does not show up on your server please re-add the bot using a new link: https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617'
        );
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }
        parsed = CommandParser.parse(
            args,
            new OrParser(
                new TempleSetParser(),
                new AnyOrderParser(
                    new OptionalParser(new CashParser()),
                    new OptionalParser(new CashParser()),
                    new OptionalParser(new CashParser()),
                    new OptionalParser(new CashParser())
                )
            )
        );

        if (parsed.hasErrors()) {
            return message.channel.send('temporary error message, will fix later');
        }
        // fill the parsed.cashs array with undefined so it works with the reactor
        if (!parsed.cashs) parsed.cashs = [undefined, undefined, undefined, undefined];
        else if (parsed.cashs.length != 4) {
            for (let i = 0; i < 4 - parsed.cashs.length; i++) {
                parsed.cashs.push(undefined);
            }
        }
        if (!parsed.temple_set) {
            ReactionChain.process(
                message,
                (message, results) => displayTempleStatsByCash(message, results),
                new SingleTextParser(new CashParser(), 'sacrificed_primary', parsed.cashs[0]),
                new SingleTextParser(new CashParser(), 'sacrificed_military', parsed.cashs[1]),
                new SingleTextParser(new CashParser(), 'sacrificed_magic', parsed.cashs[2]),
                new SingleTextParser(new CashParser(), 'sacrificed_support', parsed.cashs[3])
            );
        } else await displayTempleStatsBySet(message, parsed.temple_set);
    },
    async errorMessage(message, errorMessages) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Cause(s)', errorMessages.join('\n'))
            .addField('Type `q!alias` for help', '\u200b')
            .setColor(colours['orange']);

        return await message.channel.send({ embeds: [errorEmbed] });
    },
    async helpMessage(message) {
        let messageEmbed = new Discord.MessageEmbed()
            .setTitle('q!temple')
            .addField('Use', 'Get temple statistics')
            .addField(
                'Example: `q!temple 2221`; `q!temple 50001 50001 0 42069`',
                'For the second type, it is `<primary> <military> <magic> <support>`. If a certain value is omitted I will prompt you for a value.'
            )
            .addField('vtsg', 'use q!vtsg');
        return await message.channel.send({ embeds: [messageEmbed] });
    }
};
async function displayTempleStatsBySet(message, temple_set) {
    templeSet = temple_set.split('').map(function (x) {
        return parseInt(x);
    });
    let embed = new Discord.MessageEmbed().setColor(yellow);
    embed.setTitle(temple_set);
    for (let i = 0; i < 4; i++) {
        addSacrificeStats(embed, templeSet[i], i);
    }
    return await message.channel.send({ embeds: [embed] });
}
function addSacrificeStats(embed, num, i) {
    if (num == 0) return;
    if (num == 1) {
        return embed.addField(titles[i], `${t[i][0]}\n${t[i][9]}`);
    }
    if (num == 2) {
        return embed.addField(titles[i], `${t[i][0]}\n${t[i][9]}\n**TSG**:\n${t2[i]}`);
    }
}
async function displayTempleStatsByCash(message, results) {
    let embed = new Discord.MessageEmbed();
    embed.setTitle('Temple stats');
    embed.setColor(yellow);
    // there is probably a better way
    embed.addField('Primary sacrifice', t[0][0] + '\n' + levelToString(cashToLevel(results.sacrificed_primary_cash), 0));
    embed.addField('Military sacrifice', t[1][0] + '\n' + levelToString(cashToLevel(results.sacrificed_military_cash), 1));
    embed.addField('Magic sacrifice', t[2][0] + '\n' + levelToString(cashToLevel(results.sacrificed_military_cash), 2));
    embed.addField('Support sacrifice', t[3][0] + '\n' + levelToString(cashToLevel(results.sacrificed_military_cash), 3));
    return await message.channel.send({ embeds: [embed] });
}
/**
 * input cash, returns a number from 0 - 9 about the temple's sacrifice level.
 * @param {int} cash
 * @returns {int}
 */
function cashToLevel(cash) {
    let sacrifice_levels = [300, 1000, 2000, 4000, 7500, 10000, 15000, 25000, 50000];
    for (let i = 0; i < 9; i++) {
        if (cash < sacrifice_levels[i]) return i;
    }
    return 9;
}
/**
 * given level and tower type, return the string
 * @param {int} level
 * @param {int} towerType
 * @returns
 */
function levelToString(level, towerType) {
    if (level == 0) return;
    return t[towerType][level];
}
