const Parsed = require('./parsed.js');
const OptionalParser = require('./optional-parser.js');
const OrParser = require('./or-parser.js');
const EmptyParser = require('./empty-parser.js');
const ParsingError = require('../exceptions/parsing-error.js');

module.exports = {
    /**
     * Parses arguments minding the ordering `parsers` array
     * Takes into account abstract parsers and resolves them to be concrete
     *  - If there is a perfect match then return it.
     *  - If not, return the attempt with the fewest errors.
     *
     * @param {[String]} args Command arguments
     * @param  {...{Type}Parser} parsers An expanded list of parsers; some may be optional
     */
    parse(args, ...parsers) {
        return concretizeAndParse(args, parsers, 0);
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

// Handlers must take a parser list and return a list of parser lists
ABSTRACT_PARSERS = [
    {parser: OptionalParser, handler: permutateOptionalParser},
    {parser: OrParser, handler: expandOrParser},
    {parser: EmptyParser, handler: removeEmptyParser},
],

function concretizeAndParse(args, parsers, abstractParserIndex) {
    // Base case: all abstract parsers have been concretized
    if (parsers.filter(p => isAbstract(p)).length == 0) {
        return parseConcrete(args, parsers);
    }

    // Keep track of the result with the fewest errors
    parsingErrorWithMinErrors = null;

    // Get abstact parser function using the cycling index 
    concretizeParserFunction = ABSTRACT_PARSERS[abstractParserIndex].handler;
    // and call the function on the parsers
    moreConcreteParsingAttempts = concretizeParserFunction.call(parsers);

    // Loop through the results and recurse, then taking the most successful result
    // i.e. either the successful parsing attempt or the attempt with the fewest errors
    for (var i = 0; i < moreConcreteParsingAttempts.length; i++) {
        // Unpack results
        moreConcreteParsers = moreConcreteParsingAttempts[i].parsers;
        alreadyParsed = moreConcreteParsingAttempts[i].parsed;

        // Cycle to the next abstract parser
        newAbstractParserIndex = (abstractParserIndex + 1) % this.ABSTRACT_PARSERS.length
        try {
            // Recurse and return result if successful
            return concretizeAndParse(args, moreConcreteParsers, newAbstractParserIndex)
        } catch (e) {
            if (e instanceof ParsingError) {
                // Did the parsing attempt fail with less errors than the best attempt so far?
                if (e.parsingErrors.length < parsingErrorWithMinErrors.parsingErrors.length) {
                    // Then this is now the best attempt
                    parsingErrorWithMinErrors = e;
                }
            } else {
                // Bubble up error
                throw e;
            }
        }
    }

    // A value was never returned
    throw parsingErrorWithMinErrors;
}

function isAbstract(parser) {
    return ABSTRACT_PARSERS.map(ap => ap.parser).includes(parser)
}

function permutateOptionalParser(parsers) {
    optionalParserIndex = parsers.findIndex(p => p instanceof OptionalParser);

    if (optionalParserIndex == -1) {
        return {parsers: parsers, parsed: new Parsed()};
    }

    opt = parsers[optionalParserIndex]

    // Include the optional parser's wrapped parser
    useIt =
        parsers.slice(0, optionalParserIndex)
                .concat([opt.parser])
                .concat(parsers.slice(optionalParserIndex + 1));
    
    // Exclude the optional parser's wrapped parser
    loseIt =
        parsers.slice(0, optionalParserIndex)
                .concat(parsers.slice(optionalParserIndex + 1))
    
    loseItParsed = new Parsed();
    loseItParsed.addField(p.type(), opt.defaultValue);

    return [
        {parsers: useIt, parsed: new Parsed()},
        {parsers: loseIt, parsed: loseItParsed}
    ]
}

function expandOrParser(parsers) {
    orParserIndex = parsers.findIndex(p => p instanceof OrParser)

    if (orParserIndex == -1) {
        return {parsers: parsers, parsed: new Parsed()};
    }

    parserLists = []
    orParser = parsers[orParserIndex];

    for (var i = 0; i < orParser.parserLists.length; i++) {
        parserLists.push(
            parsers.slice(0, orParserIndex)
                    .concat(orParser.parserLists[i])
                    .concat(parsers.slice(orParserIndex + 1))
        );
    }
    
    // No values were parsed in the OrParser concretization process
    return parserLists.map(function(l) {
        return {parsers: l, parsed: new Parsed()}
    });
}

function removeEmptyParser(parsers) {
    emptyParserIndex = parsers.findIndex(p => p instanceof EmptyParser);

    if (emptyParserIndex == -1) {
        return {parsers: parsers, parsed: new Parsed()}
    }

    moreConcreteParsers = parsers.slice(0, emptyParserIndex)
                                .concat(parsers.slice(emptyParserIndex + 1));

    // No values were parsed in the OrParser concretization process
    return {parsers: moreConcreteParsers, parsed: new Parsed()}
}

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

        if (isAbstract(parser)) {
            throw `Abstract parser of type ${typeof Parser} found in concrete parsing. Something went wrong here.`;
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
