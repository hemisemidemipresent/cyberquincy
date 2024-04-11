class AnyOrderParser {
    constructor(...parsers) {
        this.parsers = parsers;
    }

    type() {
        return 'any_order';
    }

    parse() {
        throw `Must not parse directly from the AnyOrderParser. Must parse argument list parsers instead`;
    }
}

module.exports = AnyOrderParser;
