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

concretizeAndParse = function(args, parsers, abstractParserIndex) {
    // Base case: all abstract parsers have been concretized
    if (parsers.filter(p => isAbstractParser(p)).length == 0) {
        return parseConcrete(args, parsers);
    }

    // Keep track of the result with the fewest errors
    parsingErrorWithMinErrors = null;

    // Get abstact parser function using the cycling index 
    concretizeParserFunction = ABSTRACT_PARSERS[abstractParserIndex].handler;
    // and call the function on the parsers
    moreConcreteParsingAttempts = concretizeParserFunction.call(this, parsers);

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
            parsed = concretizeAndParse(args, moreConcreteParsers, newAbstractParserIndex)
            return parsed.merge(alreadyParsed);
        } catch (e) {
            if (e instanceof ParsingError) {
                // Did the parsing attempt fail with less errors than the best attempt so far?
                if (!parsingErrorWithMinErrors) {
                    parsingErrorWithMinErrors = e;
                } else if (e.parsingErrors.length < parsingErrorWithMinErrors.parsingErrors.length) {
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

isAbstractParser = function(parser) {
    return ABSTRACT_PARSERS.map(ap => ap.parser).includes(parser.constructor)
}

/**
 * Finds the first optional parser
 *   - If it exists, the parser list gets slightly concretized:
 *     the function creates two new parser lists by replacing
 *     the OptionalParser in one list with the wrapped parser 
 *     in its place and for the other list NO parser in its place.
 * If there is no OptionalParser, the function just returns the whole parser list
 */
permutateOptionalParser = function(parsers) {
    optionalParserIndex = parsers.findIndex(p => p instanceof OptionalParser);

    // Return the whole list if there's no OptionalParser found
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
    
    // Include the parsed value in the return object
    loseItParsed = new Parsed();
    loseItParsed.addField(opt.parser.type(), opt.defaultValue);

    return [
        {parsers: useIt, parsed: new Parsed()},
        {parsers: loseIt, parsed: loseItParsed}
    ]
}

/**
 * Finds the first OrParser
 *   - If it exists, the parser list gets slightly concretized.
 *     Each newly created parser list will be the original parser
 *     list except the OrParser is replaced with one of the parser lists 
 *     specified in the command's OrParser constructor.
 * If there is no OrParser, the function just returns the original list
*/
expandOrParser = function(parsers) {
    orParserIndex = parsers.findIndex(p => p instanceof OrParser)

    // Return the whole list if there's no OrParser found 
    if (orParserIndex == -1) {
        return {parsers: parsers, parsed: new Parsed()};
    }

    parserLists = []
    orParser = parsers[orParserIndex];

    // Create a new list for every parserList provided in the command's OrParser constructor
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

/**
 * Finds the first EmptyParser
 *   - If it exists, the parser list gets slightly concretized:
 *     the EmptyParser is simply removed.
 * If there is no EmptyParser, the function just returns the original list
*/
removeEmptyParser = function(parsers) {
    emptyParserIndex = parsers.findIndex(p => p instanceof EmptyParser);

    // Return the whole list if there's no OrParser found 
    if (emptyParserIndex == -1) {
        return {parsers: parsers, parsed: new Parsed()}
    }

    // Just remove the EmptyParser if it exists
    moreConcreteParsers = parsers.slice(0, emptyParserIndex)
                                .concat(parsers.slice(emptyParserIndex + 1));

    // No values were parsed in the OrParser concretization process
    return {parsers: moreConcreteParsers, parsed: new Parsed()}
}

/**
 * A list of different types of abstract parsers
 * and the handler that concretizes it.
 * Handlers must take a parser list and return an object:
 *   - {parsers: parserList, parsed: ParsedObject}
 *     where `parserList` is the same list of parsers but with
 *     at least one instance of the specified parser type
 *     concretized if it can be found at the top level of the list.
 *     and `parsed` is whatever might've been parsed in the concretization
 *     (such as a default value that sticks in for an unused OptionalParser)
 */
ABSTRACT_PARSERS = [
    {parser: OptionalParser, handler: permutateOptionalParser},
    {parser: OrParser, handler: expandOrParser},
    {parser: EmptyParser, handler: removeEmptyParser},
],

/**
 * Attempts to parse and returns the result if fully successful
 * Otherwise throws a ParsingError encapsulating all command errors encountered along the way.
 *
 * @param {[String]} args Command arguments
 * @param {[{Type}Parser]} parsers An expanded list of parsers
 */
parseConcrete = function(args, parsers) {
    // The returned result that the command can read
    parsed = new Parsed();

    // Keeps track of all errors generating during parsing attempt
    parsingError = new ParsingError();

    // Iterate over parsers + arguments
    for (let i = 0; i < Math.min(parsers.length, args.length); i++) {
        parser = parsers[i];
        arg = args[i];

        if (isAbstractParser(parser)) {
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
