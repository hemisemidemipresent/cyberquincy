const TempleSetParser = require('../parser/temple-set-parser');
const OptionalParser = require('../parser/optional-parser');
const ReactionChain = require('../helpers/reactor/reaction_chain');
const CashParser = require('../parser/cash-parser');
const t = require('../jsons/temple.json');
const SingleTextParser = require('../helpers/reactor/single_text_parser');
const AnyOrderParser = require('../parser/any-order-parser');
const OrParser = require('../parser/or-parser');
module.exports = {
    name: 'temple',
    aliases: ['t', 'tsg', 'sg', 'monkeygod', 'god', 'totmg', 'vtsg'],
    execute(message, args) {
        return message.channel.send('under construction');
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
        if (!parsed.temple_set) {
            ReactionChain.process(
                message,
                (message, results) => displayTempleStats(message, results),
                new SingleTextParser(
                    new CashParser(),
                    'sacrificed_primary',
                    parsed.cashs[0]
                )
            );
        }
    },
};
function displayTempleStats(message, results) {
    console.log(results);
}
