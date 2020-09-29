# Parsing

## Table of Contents

-   [For Command Developers](#command-devs)
    -   [Introduction](#introduction)
    -   [Utilization Techniques](#utilization)
        - [Examples](#utilization-examples)
        - [Parser Breakdown](#parser-breakdown)
    -   [The Above in Simple Terms](#simplified)
    -   [Parser Library Glimpse](#parser-library)
    -   [Parser Structure](#parser-class)

<a name="command-devs"></a>

## For Command Developers

<a name="introduction"></a>

#### Introduction

The cyberquincy parsing library is robust and thorough. It's highly recommended that all new commands use it.

The command parser serves a number of advantages

-   It makes you think carefully about what values each argument in the command expects
-   It makes it quite easy to accept arguments in any order
-   It allows you to make certain command arguments optional and provide a default value if the user doesn't provide a matching argument
-   It provides validations based on the permitted values that get passed into the parser's constructor
-   A user who structures a command + arguments incorrectly will be provided the smallest set of error messages in order to understand what went wrong.

<a name="utilization"></a>

#### Utilization techniques

<a name="utilization-examples"></a>

**Example Usages**

Example #1 (Simple Example - Index LCC command)
<a name="utilization-example-1"></a>

```js
// Catch help arguments before the parser
if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
    return module.exports.helpMessage(message);
}

// Expects one argument; just a map
const parsed = CommandParser.parse(args, new MapParser());

// No exceptions are thrown. Errors must be dealt with manually
if (parsed.hasErrors()) {
    return module.exports.errorMessage(message, parsed.parsingErrors);
}

// If parsing was successful, then parsed.map will be the map the user entered as the 1 arg
return displayLCC(parsed.map;)
```
<a name="utilization-example-2"></a>

Example #2 (Complex Example - Index 2TC command)
```js
if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
    return module.exports.helpMessage(message);
}

towerOrHeroParser = new OrParser(
    new TowerUpgradeParser(),
    new HeroParser()
)
    
parsers = [
    // Which 2TC's have been done on this map?
    new MapParser(),
    // Get 2TC by combo number, optionally on the specified map
    new AnyOrderParser(
        new NaturalNumberParser(),
        new OptionalParser(new MapParser())
    ),
    // Get 2TCs containing tower (optionally both towers), optionally on the specified map
    new AnyOrderParser(
        towerOrHeroParser,
        new OptionalParser(towerOrHeroParser),
        new OptionalParser(new MapParser())
    ),
];

const parsed = CommandParser.parse(args, new OrParser(...parsers));

if (parsed.hasErrors()) {
    return module.exports.errorMessage(message, parsed.parsingErrors);
}

// Here, you'll have to check whether parsed.map, parsed.natural_number, parsed.tower_upgrade, etc.
// have been collected from the parser. The number of optional parsers means you'll have to check
// what was parsed and what wasn't and decide how to reply to the user accordingly
```

The following breakdown of available parsers will reference the above examples.

<a name="parser-breakdown"></a>
### Parser Breakdown
You must call `CommandParser.parse()` with arguments `args, Parser1{, Parser2, ... ParserN}`. A parser is meant to interpret a single user argument, where the arguments are space-separated tokens entered by the user following the `q!<command>`. There are two classes of Parsers: Concrete Parsers and Abstract Parsers.

<a name="concrete-parsers">

##### Concrete Parsers

Concrete parsers are your basic building blocks for interpreting a user's command. Concrete parsers include `TowerUpgradeParser` (which parses things like "wlp" and "spirit_of_the_forest"), `HeroParser` ("obyn", "ben", "ezi"), `BloonParser` ("red", "zebra", "zomg"), and much more.

If your command needs to parse a single map (such as for the command `q!lcc`), then you would write what can be seen in [example #1](#utilization-example-1) above. If your command expects a round number and a game mode (such as `abr` or `impoppable`) then you would write:

```js
const parsed = CommandParser.parse(args, new RoundParser(), new ModeParser());
```

Each concrete parser dictates what values they accept, so if the first argument is "banana" to a command that uses the above parsing structure, then `RoundParser` would fail to parse the argument and there would be a parsing error (to be discussed soon) contained within the `parsed` return value once the attempt finishes.

Making items optional or order-agnostic will be introduced in the next section.

<a name="abstract-parsers">

##### Abstract Parsers

Abstract parsers and parsers that take in zero or more parsers to provide an enhanced parsing mechanism. One good example is the `OrParser` as in [Example #2](#utilization-example-2) which takes in a list of arguments, each of which represents a parsing possibility. So if you had something like

```js
const parsed = CommandParser.parse(
    args,
    new OrParser(
        new NaturalNumberParser(),
        new Mode Parser(),
        new Map Parser(),
    )
)
```

parsing would succeed if the user provided one argument that either one of the three parsers recognized. A 2-argument command invocation would fail here because in any case, the parser is expecting just one argument. Note that arguments to `OrParser` can also be lists of parsers as in

```js
const parsed = CommandParser.parse(
    args,
    new OrParser(
        [new NaturalNumberParser(), new ModeParser()],
        new Map Parser(),
    )
)
```

In contrast, this takes in either
1. a natural number AND a mode
2. just a map.

Another key parser to be aware of is `AnyOrderParser`. It's pretty simple: you provide a list of parsers and the command parser will look for user input in any permutation of the parser ordering, as in

```js
const parsed = CommandParser.parse(
    args,
    new AnyOrderParser(
        new NaturalNumberParser(),
        new Mode Parser(),
        new Map Parser(),
    )
)
```

A command that uses this parsing structure would be looking for a 3-argument invocation of the command with a natural number, a mode (like "impoppable"), and a map (like "cube"). `AnyOrderParser` allows the order to not matter though, so `q!<command> abr cube 3` would parse successfully here.

There are two other parsers to be aware of. `OptionalParser` takes in a parser and a default value if the parsing fails. The default value must be a value that if the user entered it, the parser itself could parse. The default value is optional though and can be left out. Here are two examples:

```js
// With default value
const parsed = CommandParser.parse(
    args,
    new OptionalParser(
        new ModeParser(),
        'abr'
    )
)
```

```js
// Without default value
const parsed = CommandParser.parse(
    args,
    new OptionalParser(
        new ModeParser(),
    )
)
```

The following would raise an exception because `8` is not a valid "mode":

```js
// With default value
const parsed = CommandParser.parse(
    args,
    new OptionalParser(
        new ModeParser(),
        8
    )
)
```

Finally, `EmptyParser` parses nothing and doesn't throw away an argument slot. It's useful when you have an `OrParser` and you want one of the options to be no extra argument as in

```js
const parsed = CommandParser.parse(
    args,
    new NaturalNumberParser()
    new OrParser(
        new MapParser(),
        new MapDifficultyParser(),
        new EmptyParser(), // Works great here if you want one parsing possibility to be just a single natural number, no map or map difficulty needed.
    )
)
```

That is to say that the following are all valid

`q!<command> 1 cube`
`q!<command> 1 beginner`
`q!<command> 1` (<-- This is what the `EmptyParser` allows!)

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

<a name="simplified"></a>

#### The Above in Simpler Terms

So you know how commands can take a long list of arguments? It's in the array `args`. The parser basically helps to parse all that raw user input.

First you define a variable. In the example above its called `parsed`. You let that either be a `CommandParser.parse()` or `CommandParser.parseAnyOrder()`.

You first put `args` inside the function. Then you put in your parsers. How? Lets say you want an optional parser for a mode, e.g. like in `q!income`, you don't need a mode, but the mode matters. you then put in `new OptionalParser()` into the function.

The function should look something like this:

```js
let parsed = CommandParser.parseAnyOrder(args, new OptionalParser());
```

In the new `OptionalParser()` it accepts 2 things, a parser and a "fallback option". So for example

```js
new OptionalParser(new ModeParser('CHIMPS', 'ABR', 'HALFCASH'), 'CHIMPS');
```

means that this `OptionalParser()` has `ModeParser()` as its parser, and if the parser can't find that mode, it resorts to the second input, in this case `'CHIMPS'`.
We can add more parsers inside the `parseAnyOrder()` function. In this case we would like to know the round (compulsory), so we add `newRoundParser('IMPOPPABLE')`. What this does is check whether the round provided fits into the impoppable gamemode criteria, i.e. whether or not `6<=round<=100`

So far, it should look something like this:

```js
parsed = CommandParser.parseAnyOrder(
    args,
    new OptionalParser(new ModeParser('CHIMPS', 'ABR', 'HALFCASH'), 'CHIMPS'),
    new RoundParser('IMPOPPABLE')
);
```

that is essentially it. There is just a few more steps:

1. add a `try{}` and `catch{}` code blocks:

```js
try {
    parsed = CommandParser.parseAnyOrder(
        args,
        new OptionalParser(
            new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),
            'CHIMPS'
        ),
        new RoundParser('IMPOPPABLE')
    );
} catch (e) {}
```

2. add a form of error message for `ParsingError`s specifically

```js
try {
    parsed = CommandParser.parseAnyOrder(
        args,
        new OptionalParser(
            new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),
            'CHIMPS'
        ),
        new RoundParser('IMPOPPABLE')
    );
} catch (e) {
    if (e instanceof ParsingError) {
        module.exports.errorMessage(message, e);
    } else {
        throw e;
    }
}
```

You can access the mode inputted by using `parsed.mode` like this:

```js
try {
    parsed = CommandParser.parseAnyOrder(
        args,
        new OptionalParser(
            new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),
            'CHIMPS'
        ),
        new RoundParser('IMPOPPABLE')
    );

    return message.channel.send(
        `mode inputted is ${parsed.mode}, round inputted is ${parsed.round}`
    );
} catch (e) {
    if (e instanceof ParsingError) {
        module.exports.errorMessage(message, e);
    } else {
        throw e;
    }
}
```

and that's it! You've not only ensured that the commands you run are "safe", but you've also given the user opportunities to learn from entering incorrectly-formatted commands!

<a name="parser-library"></a>

### Parser Library Glimpse

<table>
    <thead>
        <tr>
            <th>Parser</th>
            <th>Description</th>
            <th>Developer Inputs</th>
            <th>User Inputs</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>RoundParser</code></td>
            <td>Utilizes <code>NaturalNumberParser</code> to parse a round number, limited by the difficulty (<code>IMPOPPABLE</code> --> <code>6-100</code>).</td>
            <td>"IMPOPPABLE", "HARD", "MEDIUM", "EASY"</td>
            <td>Formats: <code>15</code>, <code>R15</code>, <code>round15</code></td>
        </tr>
        <tr>
            <td><code>NaturalNumberParser</code></td>
            <td>Parses a positive integer between <code>low</code> and <code>high</code></td>
            <td><code>(6, 100)</code>, <code>(-Infinity, 0)</code>, ...</td>
            <td>1, 2, 3, ..., 1000, ..., <code>Infinity</code></td>
        </tr>
        <tr>
            <td><code>ModeParser</code></td>
            <td>Parses a Btd6 Gamemode</td>
            <td>"STANDARD","PRIMARYONLY","DEFLATION","MILITARYONLY",
            "APOPALYPSE","REVERSE","MAGICONLY","DOUBLEHP","HALFCASH"
            ,"ABR","IMPOPPABLE","CHIMPS"</td>
            <td><-- Same</td>
        </tr>
    </tbody>
    <tfoot>
        <tr>
            <th colspan="4">Check the /parser folder (you're in it) for a full list of parsers</th>
        </tr>
    </tfoot>
</table>

<a name="parser-class"></a>

## Parser Structure

There are 2 types of parsers, logic parsers (OrParser, OptionalParser, AnyOrderParser, etc) and arg parsers (map, mode, hero, difficulty, number, round, cash, etc...) This will be talking about arg parsers because logic parsers are deep

-   example: cashParser

```js
const NumberParser = require('./number-parser.js');

// Looks for a round number, permitting natural numbers based on the difficulty provided to the constructor.
// Discord command users can provide the round in any of the following forms:
//    - 15, r15, round15
// Check the DifficultyParser for all possible difficulties that can be provided
module.exports = class CashParser {
    type() {
        return 'cash';
    }

    constructor(low = 0, high = Infinity) {
        this.delegateParser = new NumberParser(low, high);
    }

    parse(arg) {
        // Convert `$5` to just `5`
        arg = this.transformArgument(arg);
        return this.delegateParser.parse(arg);
    }

    // Parses all ways the command user could enter a round
    transformArgument(arg) {
        if (arg[0] == '$') {
            return arg.slice(1);
        } else if (/\d|\./.test(arg[0])) {
            return arg;
        } else {
            throw new UserCommandError(
                `Cash must be of form \`15\` or \`$15\` (Got \`${arg}\` instead)`
            );
        }
    }
};
```

### type()

```js
type() {
        return 'cash';
    }

```

`type()` defines the key the value is stored. In this case since you get the cash using `parsed.cash`, it returns `'cash'`

### constructor()

```js
constructor(low=0, high=Infinity) {
        this.delegateParser = new NumberParser(low, high);
    }
```

`constructor()` only defines the `this` object, common examples include `this.delegateParser`, which is the "base" parser (for example round parser is basically a number parser for examoke)

### parse()

```js
parse(arg) {
        // Convert `$5` to just `5`
        arg = this.transformArgument(arg);
        return this.delegateParser.parse(arg);
    }
```

`parse()` does the actual parsing, though it usually calls upon the `this.delegateParser`

#### Any other functions are probably just to help the parsing go smoother
