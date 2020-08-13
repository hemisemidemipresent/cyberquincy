const Parsed = require('./parsed.js');
const OptionalParser = require('./optional-parser.js');
const OptionalParserError = require('../exceptions/optional-parser-error.js');
const ParsingError = require('../exceptions/parsing-error.js');

module.exports = {
    /**
     * Parses arguments minding the `parsers` array ordering
     * Takes into account optional arguments and finds the permutation
     * of applying optional parsers to find the best parsing match.
     *  - If there is a perfect match then return it.
     *  - If not, return the attempt with the fewest errors. 
     * 
     * @param {[String]} args Command arguments
     * @param  {...{Type}Parser} parsers An expanded list of parsers; some may be optional 
     */
    parse(args, ...parsers) {
        parsingErrorWithMinErrors = null;

        numOptionalArguments = parsers.filter(p => p instanceof OptionalParser).length;

        // Count up in binary to account for all permutations 
        // of including/not including optional arguments in parsing attempt 
        for (var i = 0; i < Math.pow(2, numOptionalArguments); i++) {
            // 0 digit means optional parser should be on, 1 off
            // So if there are 4 optional parsers,
            // 0110 means that the second and third optional parsers should be ommitted in the parsing attempt
            // And the flags below will be [true, false, false, true]
            // 0 must be true because of the base case
            optionalParserFlags = i.toString().padStart(numOptionalArguments, '0').split("").map(c => c == '0');

            // Parsers to be included in the concrete parsing (with optional parsers either solidified or excluded)
            concreteParsers = []

            optionalParserFlagsIndex = 0;

            // Will hold the default values of the excluded parsers
            // (Remember if an optional parser doesn't find a match,
            // it stubs in the default value specified by the command developer)
            parsedDefaultValues = new Parsed();

            // Loop through all parsers in order and include all parsers but
            // the optional ones that are to be turned off
            for (var j = 0; j < parsers.length; j++) {
                if (parsers[j] instanceof OptionalParser) {
                    // If the optional parser has been assigned a 0, meaning it should be included..
                    if (optionalParserFlags[optionalParserFlagsIndex]) {
                        // Add the parser wrapped by the OptionalParser to the list of concrete parsers
                        concreteParsers.push(parsers[j].parser);
                    } else {
                        // Otherwise, add the concrete parser's type and default value to the parsed default values
                        type = parsers[j].parser.type();
                        value = parsers[j].defaultValue
                        parsedDefaultValues.addField(type, value);
                    }
                    optionalParserFlagsIndex++;
                } else {
                    // Add non-optional parsers to the array unconditionally
                    concreteParsers.push(parsers[j]);
                }
            }
            try {
                // Take the included parsers and parse 1:1 with the args 
                result = module.exports.parseConcrete(args, concreteParsers);
                // Return the first successful parsing attempt
                return result.merge(parsedDefaultValues);
            } catch(e) {
                if(e instanceof ParsingError) {
                    // Keep track of the concrete parsing attempt with the fewest errors.
                    // These error messages are likely to best reflect what the user was trying to do
                    if (parsingErrorWithMinErrors) {
                        // Keep track of the parser with the minimum errors
                        if (e.parsingErrors.length < parsingErrorWithMinErrors.parsingErrors.length) {
                            parsingErrorWithMinErrors = e;
                        }
                    } else {
                        // If there is no minimum, this is the minimum
                        parsingErrorWithMinErrors = e;
                    }
                } else {
                    // Bubble up
                    throw e;
                }
            }
        }

        throw parsingErrorWithMinErrors;
    },

    /**
     * Attempts to parse and returns the result if fully successful
     * Otherwise throws a ParsingError encapsulating all command errors encountered along the way.
     * 
     * @param {[String]} args Command arguments
     * @param {[{Type}Parser]} parsers An expanded list of parsers
     */
    parseConcrete(args, parsers) {
        // The returned result that the command can read
        parsed = new Parsed();

        // Keeps track of all errors generating during parsing attempt
        parsingError = new ParsingError()

        // Iterate over parsers + arguments
        for (var i = 0; i < Math.min(parsers.length, args.length); i++) {
            parser = parsers[i];
            arg = args[i];

            if (parser instanceof OptionalParser) {
                throw 'Optional parser found in concrete parsing. Something went wrong here.';
            }

            try {
                value = parser.parse(arg);
                parsed.addField(parser.type(), value);
            } catch(e) {
                if (e instanceof UserCommandError) {
                    parsingError.addError(e);
                } else {
                    // DeveloperCommandError for example
                    throw e;
                }
            }
        }

        // Include an error for every missing argument
        for (var i = args.length; i < parsers.length; i++) {
            parsingError.addError(
                new UserCommandError(`Command is missing ${h.toOrdinalSuffix(i + 1)} argument of type \`${parsers[i].type()}\``)
            );
        }

        // Include an error for every extra argument
        for (var i = parsers.length; i < args.length; i++) {
            parsingError.addError(
                new UserCommandError(`Extra argument ${args[i]} at position ${i + 1}`)
            );
        }

        if (parsingError.hasErrors()) {
            throw parsingError;
        }
        
        return parsed;
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
            } catch(e) {
                if (e instanceof ParsingError) {
                    parsingErrors[i] = e;
                } else {
                    // Bubble up error
                    throw e;
                }
            }
        }

        // Sort parsing errors from least to most caught errors
        parsingErrors.sort((a, b) => a.parsingErrors.length - b.parsingErrors.length)
        // The one with the least number of errors is likely to tell the best story
        throw parsingErrors[0];
    },
}