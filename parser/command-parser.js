const Parsed = require('./parsed.js');
const OptionalParser = require('./optional-parser.js');
const OptionalParserError = require('../exceptions/optional-parser-error.js');

module.exports = {
    parse(args, ...parsers) {
        module.exports.validateNumArgs(args, parsers);

        parsed = new Parsed();

        aIdx = 0;

        for (pIdx = 0; pIdx < parsers.length; pIdx++) {
            parser = parsers[pIdx];
            arg = args[aIdx];

            try {
                value = parser.parse(arg);
                aIdx++;
            } catch(e) {
                if (e instanceof OptionalParserError) {
                    value = parser.defaultValue;
                    // Don't increment aIdx
                }
                else throw e;
            }

            parsed.addField(parser.type(), value);
        }

        // All of the arguments must be parsed
        // Otherwise the optional parser jumped in too soon
        
        if (aIdx === args.length) {
            return parsed;
        } else {
            throw new UserCommandError('Arguments provided did not line up with what the command expects');
        }
    },

    validateNumArgs(args, parsers) {
        numOptionalArguments = parsers.filter(p => p instanceof OptionalParser).length;
        
        minNumArgs = parsers.length - numOptionalArguments.length;
        maxNumArgs = parsers.length;

        if (minNumArgs === maxNumArgs) {
            if (args.length !== parsers.length) {
                throw new UserCommandError(`Expected ${parsers.length} arguments but received ${args.length}`);
            }
        } else {
            if (args.length < minNumArgs || args.length > maxNumArgs) {
                throw new UserCommandError(`Expected between ${minNumArgs} and ${maxNumArgs} arguments but got ${args.length}`)
            } 
        }
        return true;
    },

    parseAnyOrder(args, ...parsers) {
        // Get all permutations of parser ordering
        parserPermutations = h.allLengthNPermutations(parsers);

        var parsed = undefined;

        // Try-catch parsing the args with every parser ordering
        for (i = 0; i < parserPermutations.length; i++) {
            parserOrdering = parserPermutations[i];

            try {
                parsed = module.exports.parse(args, ...parserOrdering);
                break;
            } catch(e) {
                if (e instanceof UserCommandError) {
                    // Do nothing and continue
                } else {
                    // Bubble up error
                    throw e;
                }
            }
        }

        // If it works return it
        if (parsed) {
            return parsed;
        } else {
            throw new UserCommandError(`No parsing match!`);
        }
    }
}