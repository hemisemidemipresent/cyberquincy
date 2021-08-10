// Prompts the user to type a single field of text
//
// Uses the specified parser to ensure that the value entered is valid
//
// This reactor will add { fieldName: parsed_value } to the `results` object
// e.g. { round: 21} OR { tower_upgrade: 'sniper#300' }
//
// Will pick deFault if not null and ignore the above steps
class SingleTextParser {
    constructor(parser, fieldName, deFault) {
        this.parser = parser;
        this.fieldName = fieldName;
        this.default = deFault; // Will replace execute() if non nil
    }

    execute(message, chain, results) {
        // Only allow a single value to be entered/processed for simplicity
        // If multiple values need to be parsed, either let the user enter
        // command arguments or simply add more SingleTextParsers
        if (CommandParser.isAbstractParser(this.parser)) {
            throw `Must provide just a single concrete parser to ${typeof this}`;
        }

        const key = this.fieldName
            ? `${this.fieldName}_${this.parser.type()}`
            : this.parser.type();
        // Continue to the next interaction if default is provided
        if (this.default) {
            results[key] = this.default;
            chain.shift()(message, chain, results);
            return;
        }

        // {fieldName: 'starting', parser.type(): 'round'} => "Please type the starting round in the chat"
        // {fieldName: null, parser.type(): 'map_difficulty'} => "Please type the map difficulty in the chat"
        const fieldName = this.fieldName
            ? ` ${this.fieldName.split('_').join(' ')}`
            : '';
        message.channel.send(
            `Please type the${fieldName} ${this.parser
                .type()
                .split('_')
                .join(' ')} in the chat`
        );

        // Only collect the next value entered from the user that started the react-loop
        const sameUserFilter = (msg) => msg.author.id == message.author.id;

        message.channel
            .awaitMessages({
                filter: sameUserFilter,
                max: 1,
                time: 10000,
                errors: ['time'],
            })
            .then((collected) => {
                let value = collected.first().content;
                // Use the CommandParser to validate the value entered
                let parsed = CommandParser.parse([value], this.parser);

                if (parsed.hasErrors()) {
                    return message.channel.send(
                        new Discord.MessageEmbed()
                            .setTitle(parsed.parsingErrors[0])
                            .setColor(colours['red'])
                    );
                }

                // Add result
                results[key] = parsed[this.parser.type()];

                // Invoke first method in chain and remove it from the array
                // Then pass in the new chain with the first element having been removed
                // This progresses the react-loop.
                chain.shift()(message, chain, results);
            });
    }
}

module.exports = SingleTextParser;
