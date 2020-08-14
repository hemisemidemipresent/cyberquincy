# Parsing
### For Command Developers
##### Introduction
The cyberquincy parsing library is robust and thorough. It's highly recommended that newly written commands take good advantage of it.

The command parser serves a number of advantages
* It makes you think carefully about what values each argument in the command expects
* It makes it quite easy to accept arguments in any order
* It allows you to make certain command arguments optional wherein you can provide a default value
* It provides strict validations based on the permitted values you supply to each argument's parser
* Commands whose arguments are formatted incorrectly will be provided the smallest and most helpful set of error messages possible in order for the user to understand their mistakes.

##### Utilization techniques
**Example Usage**
```
try {
    parsed = CommandParser.parseAnyOrder(
        args,
        new OptionalParser(
            new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),
            "CHIMPS" // default if not provided
        ),
        new RoundParser("IMPOPPABLE")
    );

    return message.channel.send(chincomeMessage(parsed.mode, parsed.round));
} catch(e) {
    if (e instanceof ParsingError) {
        module.exports.errorMessage(message, e)
    } else {
        throw e;
    }
}
```
**Requirements**
1. Must either call `.parse()` or `.parseAnyOrder()` on the global `CommandParser` module.
2. Arguments must be `args, Parser1, Parser2, ... ParserN`
3. `args.length` does not need to equal the number of parsers supplied because of optional arguments
4. The default value for `OptionalParser` must be a valid option that the parser accepts from the user

**Options**
1. `OptionalParser`: delegates parsing to the constructor's _first_ argument (which must be a parser). If the delegate parser succeeds, the `OptionalParser` will return that parsed value; otherwise it will return the default value that gets passed into the `OptionalParser` constructor's _second_ argument.
2. Call `CommandParser.parse()` to lock down the ordering in which discord users must provide the command arguments . Call `CommandParser.parseAnyOrder()` to allow any ordering of the arguments.
3. The returned value is a `Parsed` object, which is just an enhanced Object. It's accessor keys are based on the `types()`s of the parsers used.
  i. The key that gets added to `parsed` for an `OptionalParser` is the wrapped parser's `type()`. In the above example, that would be `mode`.
4. `Parsed` also keeps pluralized versions of each parser's `type()`. In the above example, that would be `rounds` and (optionally) `modes`. This should be used if something like 2 `RoundParser`s are supplied, in which case `pased.round` will remain the first round that was parsed while `parsed.rounds` will be a(n unordered) list of all `RoundParser` results.

**Recommendations**
1. Catch HELP arguments before parsing. Parsing will likely fail if you try to do so after. 
2. If `parseAnyOrder()` is used with `OptionalParser`s, play around with the ordering of the parsers to consistently get the best error messages for incorrect inputs. It's likely that putting the optional parsers at the end will produce the best error messages, but not much testing on that has been done.
3. Use `try-catch` as done so in the above example: 
  i. Catch a `ParsingError` and provide the user with the list of errors encountered by the `CommandParser`: `parsingError.parsingErrors.join('\n')`
  ii. Bubble up any other type of error

##### Parser Library
###### (Check `/parser` for a full list of parsers)
* `NaturalNumberParser`: Parses a positive integer between the min and max values provided.
* `RoundParser`: Utilizes `NaturalNumberParser` to parse a round number, limited by the difficulty (`IMPOPPABLE` --> `6-100`). Handles the following formats: `15`, `R15`, and `round15`.
* `ModeParser`: accepts `CHIMPS`, `HALFCASH`, `MILITARYONLY`, etc..