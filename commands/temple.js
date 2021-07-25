const TempleSetParser = require('../parser/temple-set-parser');
const OptionalParser = require('../parser/optional-parser');
const CashParser = require('../parser/cash-parser');
const SingleTextParser = require('../helpers/reactor/single_text_parser');
const AnyOrderParser = require('../parser/any-order-parser');
const OrParser = require('../parser/or-parser');
const ReactionChain = require('../helpers/reactor/reaction_chain');

const t = require('../jsons/temple.json');
const t2 = require('../jsons/temple2.json'); // TSG variants

const { yellow } = require('../jsons/colours.json');

module.exports = {
    name: 'temple',
    aliases: ['t', 'tsg', 'sg', 'monkeygod', 'god', 'totmg', 'vtsg'],
    execute(message, args) {
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
        // fill the parsed.cashs array with undefined so it works with the reactor
        if (!parsed.cashs)
            parsed.cashs = [undefined, undefined, undefined, undefined];
        else if (parsed.cashs.length != 4) {
            for (let i = 0; i < 4 - parsed.cashs.length; i++) {
                parsed.cashs.push(undefined);
            }
        }

        if (!parsed.temple_set) {
            ReactionChain.process(
                message,
                (message, results) =>
                    displayTempleStatsByCash(message, results),
                new SingleTextParser(
                    new CashParser(),
                    'sacrificed_primary',
                    parsed.cash
                ),
                new SingleTextParser(
                    new CashParser(),
                    'sacrificed_military',
                    parsed.cashs[1]
                ),
                new SingleTextParser(
                    new CashParser(),
                    'sacrificed_magic',
                    parsed.cashs[2]
                ),
                new SingleTextParser(
                    new CashParser(),
                    'sacrificed_support',
                    parsed.cashs[3]
                )
            );
        } else displayTempleStatsBySet(message, parsed.temple_set);
    },
};
function displayTempleStatsBySet(message, temple_set) {
    temple_set = temple_set.split('').map(function (x) {
        return parseInt(x);
    });
    let embed = new Discord.MessageEmbed().setColor(yellow);
    embed.setTitle(temple_set);
    embed.addField(
        'Primary sacrifice',
        `${t[0][0]}\n${t[0][9]}\n**TSG**:\n${t2[0]}`
    );
    embed.addField(
        'Military sacrifice',
        `${t[1][0]}\n${t[1][9]}\n**TSG**:\n${t2[1]}`
    );
    embed.addField(
        'Magic sacrifice',
        `${t[2][0]}\n${t[2][9]}\n**TSG**:\n${t2[2]}`
    );
    embed.addField(
        'Support sacrifice',
        `${t[3][0]}\n${t[3][9]}\n**TSG**:\n${t2[3]}`
    );
    return message.channel.send(embed);
}
function displayTempleStatsByCash(message, results) {
    console.log(results);
    let embed = new Discord.MessageEmbed();
    embed.setTitle('Temple stats');
    embed.setColor(yellow);
    // there is probably a better way
    embed.addField(
        'Primary sacrifice',
        t[0][0] +
            '\n' +
            levelToString(cashToLevel(results.sacrificed_primary_cash), 0)
    );
    embed.addField(
        'Military sacrifice',
        t[1][0] +
            '\n' +
            levelToString(cashToLevel(results.sacrificed_military_cash), 1)
    );
    embed.addField(
        'Magic sacrifice',
        t[2][0] +
            '\n' +
            levelToString(cashToLevel(results.sacrificed_military_cash), 2)
    );
    embed.addField(
        'Support sacrifice',
        t[3][0] +
            '\n' +
            levelToString(cashToLevel(results.sacrificed_military_cash), 3)
    );
    return message.channel.send(embed);
}
/**
 * input cash, returns a number from 0 - 9 about the temple's sacrifice level.
 * @param {int} cash
 * @returns {int}
 */
function cashToLevel(cash) {
    let sacrifice_levels = [
        300, 1000, 2000, 4000, 7500, 10000, 15000, 25000, 50000,
    ];
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
