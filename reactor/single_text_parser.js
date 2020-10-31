class SingleTextParser {
    constructor(parser, fieldName, deFault) {
        this.parser = parser
        this.fieldName = fieldName
        this.default = deFault // Will replace execute() if non nil
    }

    execute(message, chain, results) {
        if (CommandParser.isAbstractParser(this.parser)) {
            throw `Must provide just a single concrete parser to ${typeof this}`
        }

        // Continue to the next interaction if default is provided
        if (this.default) {
            results[this.fieldName] = this.default;
            chain.shift()(message, chain, results)
            return;
        }

        message.channel.send(`Please type the ${this.fieldName} ${this.parser.type().split('_').join(' ')} in the chat`)

        const sameUserFilter = (msg) =>
            msg.author.id === `${message.author.id}`;

        message.channel
            .awaitMessages(sameUserFilter, {
                max: 1,
                time: 10000,
                errors: ['time'],
            })
            .then((collected) => {
                let value = collected.first().content;
                let parsed = CommandParser.parse(
                    [value],
                    this.parser,
                );
                if (parsed.hasErrors()) {
                    throw parsed.parsingErrors[0];
                }
                results[this.fieldName] = parsed[this.parser.type()];
                chain.shift()(message, chain, results)
            });
    }
}

module.exports = SingleTextParser