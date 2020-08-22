const Parsed = require('./parsed.js');
const OptionalParser = require('./optional-parser.js');
const OrParser = require('./or-parser.js');
const EmptyParser = require('./empty-parser.js');
const ParsingError = require('../exceptions/parsing-error.js');

module.exports = {
    // Handlers must take a parser list and return a list of parser lists
    ABSTRACT_PARSERS: [
        {parser: OptionalParser, handler: module.exports.permutateOptionalParsers},
        {parser: OrParser, handler: module.exports.expandOrParsers},
        {parser: EmptyParser, handler: module.exports.clearEmptyParsers},
    ],

    /**
     * Parses arguments minding the ordering `parsers` array
     * Takes into account optional arguments and finds the permutation
     * of applying optional parsers to find the best parsing match.
     *  - If there is a perfect match then return it.
     *  - If not, return the attempt with the fewest errors.
     *
     * @param {[String]} args Command arguments
     * @param  {...{Type}Parser} parsers An expanded list of parsers; some may be optional
     */
    parse(args, ...parsers) {
        concretizeParsers(parsers, 0);
    },

    concretizeParsers(parsers, abstractParserIndex) {
        if (module.exports.isConcrete(parsers)) {
            return {parsers: parsers, parsed: new Parsed()}
        }
        concretizeParserFunction = this.ABSTRACT_PARSERS[abstractParserIndex];
        concretize = concretizeParserFunction.call(this, args, parsers);
        for (var i = 0; i < argParserCombinations.length; i++) {
            nextParsers = concretize[i].parsers;
            parsed = concretize[i].parsed;
            this.concretizeParserFunction.call(nextParsers)
        }
    },

    isConcrete(parsers) {
        return parsers.filter( function(p) {
            ABSTRACT_PARSERS.map(ap => ap.parser).includes(p)
        }).length == 0;
    },

    permutateOptionalParsers(args, parsers) {
        numOptionalArguments = parsers.filter(p => p instanceof OptionalParser).length;

        // A list of concrete-parser-lists
        concreteParsersLists = [];

        // Count up in binary to account for all permutations 
        // of including/not including optional arguments in parsing attempt 
        for (var i = 0; i < Math.pow(2, numOptionalArguments); i++) {
            // 0 digit means optional parser should be on, 1 off
            // So if there are 4 optional parsers,
            // 0110 means that the second and third optional parsers should be ommitted in the parsing attempt
            // And the flags below will be [true, false, false, true]
            // 0 must be true because of the base case
            optionalParserFlags = i
                .toString()
                .padStart(numOptionalArguments, '0')
                .split('')
                .map((c) => c == '0');

            // Parsers to be included in the concrete parsing (with optional parsers either solidified or excluded)
            concreteParsers = [];

            optionalParserFlagsIndex = 0;

            // Loop through all parsers in order and include all parsers but
            // the optional ones that are to be turned off
            for (let j = 0; j < parsers.length; j++) {
                if (parsers[j] instanceof OptionalParser) {
                    // If the optional parser has been assigned a 0, meaning it should be included..
                    if (optionalParserFlags[optionalParserFlagsIndex]) {
                        // Add the parser wrapped by the OptionalParser to the list of concrete parsers
                        concreteParsers.push(parsers[j].parser);
                    } else {
                    }
                    optionalParserFlagsIndex++;
                } else {
                    // Add non-optional parsers to the array unconditionally
                    concreteParsers.push(parsers[j]);
                }
            }

            concreteParsersLists.push(concreteParsers);
        }

        return concreteParsersLists;
    },

    /**
     * Runs this file's `.parse` for every ordering permutation of the supplied parsers
     * Returns the exact match or throws the error from the "most successul" attempt
     * (The parsing attempt with the least number of errros)
     *
     * @param {[String]} args Command arguments
     * @param  {...{Type}Parser} parsers An expanded list of parsers; some may be optional
     */
    parseAnyOrder(args, ...parsers) {
        // Get all permutations of parser ordering
        parserPermutations = h.allLengthNPermutations(parsers);

        // Keep a spot for a parsing error for every parser ordering
        parsingErrors = new Array(parserPermutations.length);

        // Try-catch parsing the args with every parser ordering
        for (i = 0; i < parserPermutations.length; i++) {
            parserOrdering = parserPermutations[i];

            try {
                // Return first match
                return module.exports.parse(args, ...parserOrdering);
            } catch (e) {
                if (e instanceof ParsingError) {
                    parsingErrors[i] = e;
                } else {
                    // Bubble up error
                    throw e;
                }
            }
        }

        // Sort parsing errors from least to most caught errors
        parsingErrors.sort(
            (a, b) => a.parsingErrors.length - b.parsingErrors.length
        );
        // The one with the least number of errors is likely to tell the best story
        throw parsingErrors[0];
    },
};

/**
 * Attempts to parse and returns the result if fully successful
 * Otherwise throws a ParsingError encapsulating all command errors encountered along the way.
 *
 * @param {[String]} args Command arguments
 * @param {[{Type}Parser]} parsers An expanded list of parsers
 */
function parseConcrete(args, parsers) {
    // The returned result that the command can read
    parsed = new Parsed();

    // Keeps track of all errors generating during parsing attempt
    parsingError = new ParsingError();

    // Iterate over parsers + arguments
    for (let i = 0; i < Math.min(parsers.length, args.length); i++) {
        parser = parsers[i];
        arg = args[i];

        if (parser instanceof OptionalParser) {
            throw 'Optional parser found in concrete parsing. Something went wrong here.';
        }

        try {
            value = parser.parse(arg);
            parsed.addField(parser.type(), value);
        } catch (e) {
            if (e instanceof UserCommandError) {
                parsingError.addError(e);
            } else {
                // DeveloperCommandError for example
                throw e;
            }
        }
    }

    // Include an error for every missing argument
    for (let i = args.length; i < parsers.length; i++) {
        parsingError.addError(
            new UserCommandError(
                `Command is missing ${h.toOrdinalSuffix(
                    i + 1
                )} argument of type \`${parsers[i].type()}\``
            )
        );
    }

    // Include an error for every extra argument
    for (let i = parsers.length; i < args.length; i++) {
        parsingError.addError(
            new UserCommandError(
                `Extra argument ${args[i]} at position ${i + 1}`
            )
        );
    }

    if (parsingError.hasErrors()) {
        throw parsingError;
    }

    return parsed;
}
