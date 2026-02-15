# Parsing

### NOTE: This is fairly deprecated due to the introduction of slash commands

## Table of Contents

-   [For Command Developers](#command-devs)
    -   [Introduction](#introduction)
    -   [Utilization Techniques](#utilization)
        -   [Examples](#utilization-examples)
        -   [Parsing Breakdown](#parsing-breakdown)
        -   [parsed](#parsed)
    -   [Parser Structure](#parser-structure)
    -   [The Above in Simple Terms](#simplified)
    -   [Appendix](#appendix)
    -   [Parser Library Glimpse](#parser-library)

<a  name="command-devs"></a>

## For Command Developers

<a  name="introduction"></a>

#### Introduction

The cyberquincy parsing library is robust and thorough. It's highly recommended that all new commands use it.

The command parser serves a number of advantages

-   It makes you think carefully about what values each argument in the command expects

-   It makes it quite easy to accept arguments in any order

-   It allows you to make certain command arguments optional and provide a default value if the user doesn't provide a matching argument

-   It provides validations based on values that the user enters into commands

-   A user who structures a command + arguments incorrectly will be provided the smallest set of error messages in order to better understand what went wrong.

<a  name="utilization"></a>

#### Utilization techniques

<a  name="utilization-examples"></a>

**Example Usages**

Example #1 (Simple Example - Index LCC command)

<a  name="utilization-example-1"></a>

```js

// Catch help arguments before the parser or else parsing will fail because it's not looking for 0 args or 'help'

if (args.length ==  0  || (args.length ==  1  && args[0] ==  'help')) {

return  module.exports.helpMessage(message);

}



// Expects one argument; just a map

const parsed = CommandParser.parse(args,  new  MapParser());



// No exceptions are thrown by `.parse` above. Errors must be dealt with manually

if (parsed.hasErrors()) {

return  module.exports.errorMessage(message,  parsed.parsingErrors);

}



// If parsing was successful, then parsed.map will be the map the user entered as the 1 arg

return  displayLCC(parsed.map;)

```

<a  name="utilization-example-2"></a>

Example #2 (Complex Example - Index 2TC command)

```js
if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
    return module.exports.helpMessage(message);
}

// Looks for either a tower upgrade OR a hero in a given argument slot

towerOrHeroParser = new OrParser(new TowerUpgradeParser(), new HeroParser());

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

// have been collected from the parser. The presence of optional parsers means you'll have to check

// what was parsed and what wasn't and decide how to execute the command accordingly
```

The following breakdown of available parsers will reference the above examples.

<a  name="parsing-breakdown"></a>

### Parsing Breakdown

You must call `CommandParser.parse()` with arguments `args, Parser1, Parser2, ... ParserN` (one or more parsers is highly recommended). Each parser interprets a single user argument, where an argument is a space-separate token that comes after `q!<command>`. For example the arguments in `q!2mp sun-avatar end_of_the_road` are `sun-avatar` and `end_of_the_road`.

There are two classes of Parsers: Concrete Parsers and Abstract Parsers.

<a  name="concrete-parsers">

##### Concrete Parsers

Concrete parsers are your basic building blocks for interpreting a user's command. Concrete parsers include `TowerUpgradeParser` (which parses things like "wlp" and "spirit_of_the_forest"), `HeroParser` ("obyn", "ben", "ezi"), `BloonParser` ("red", "zebra", "zomg"), and much more.

If your command needs to parse a single map (such as for the command `q!lcc`), then you would write exactly what's in [example #1](#utilization-example-1) above. If your command expects a round number and ALSO a game mode (such as `abr` or `impoppable`) then you would write:

```js
const parsed = CommandParser.parse(args, new RoundParser(), new ModeParser());
```

Each concrete parser dictates what values they accept (see [parser structure](#parser-structure) below), so if a user enters a command like `q!<command> BANANA abr` to the above parsing structure, then `RoundParser` will try to parse `BANANA` but fail because banana can't be interpreted as a round; therefore, there would be a parsing error (to be discussed soon) contained within the `parsed` variable.

Making items optional or order-agnostic will be introduced in the next section.

<a  name="abstract-parsers">

##### Abstract Parsers

Abstract parsers and parsers that take in some number of parsers (0 in certain cases) and spit out a new parser that combines them. One good example is the `OrParser` as in [Example #2](#utilization-example-2) which takes in a variable number of parsers and tries to match ANY of them to the corresponding user argument. So if you had something like

```js

const parsed = CommandParser.parse(

args,

new  OrParser(

new  NaturalNumberParser(),

new  Mode  Parser(),

new  Map  Parser(),

)

)

```

parsing would succeed if the user provided a single argument that was either a natural number, a mode, or a map (as in `q!<command> infernal`). A 2-argument command invocation (like `q!<command> 2 abr`) would fail here because in the parser is expecting just one argument. Note that arguments to `OrParser` can also be lists of parsers as in

```js

const parsed = CommandParser.parse(

args,

new  OrParser(

[new  NaturalNumberParser(),  new  ModeParser()],

new  Map  Parser(),

)

)

```

In contrast, this takes in EITHER

1. a natural number AND a mode (`q!<command> 4 abr`)

2. just a map. (`q!<command> logs`)

Another key parser to be aware of is `AnyOrderParser`. It's pretty simple: you provide a variable number of parsers to the `AnyOrderParser` and the command parser will try to match the concrete parsers with the arguments in any order. Here's an example:

```js

const parsed = CommandParser.parse(

args,

new  AnyOrderParser(

new  NaturalNumberParser(),

new  Mode  Parser(),

new  Map  Parser(),

)

)

```

The above parsing structure would be looking for a 3-argument invocation of `q!<command>` with a natural number, a mode (like "impoppable"), AND a map (like "cube") although not necessarily in that order; for example, `q!<command> abr cube 3` would parse successfully here. Note that none of the arguments are optional; all 3 must be there.

There are two other parsers to be aware of. `OptionalParser` takes in 1. a parser and 2. a default value if the parsing fails. The default value must be a value that the parser accepts (see examples below to understand). The default value _can_ be excluded though, so if the `OptionalParser` fails to parse its corresponding argument using the provided concrete parser (`ModeParser` in the following examples), it'll just skip over it entirely and not parse anything. Here are two basic examples:

This:

```js
// With default value

const parsed = CommandParser.parse(
    args,

    new OptionalParser(new ModeParser(), 'abr')
);
```

will accept

1.  `q!<command>`, and will result in `parsed.mode` equal to `abr` <-- Compare to \\/

2.  `q!<command> chimps`, and will result in `parsed.mode` equal to `chimps`

This:

```js
// Without default value

const parsed = CommandParser.parse(args, new OptionalParser(new ModeParser()));
```

will accept

1.  `q!<command>`, and will result in `parsed.mode` equal to `undefined` <-- Compare to /\

2.  `q!<command> chimps`, and will result in `parsed.mode` equal to `chimps`

The following would raise a `DeveloperCommandError` because `8` is not a valid "mode":

```js
// With default value

const parsed = CommandParser.parse(
    args,

    new OptionalParser(new ModeParser(), 8)
);
```

Finally, `EmptyParser` parses nothing and doesn't waste the argument slot. It's useful when you have an `OrParser` and you want one of the options to be no extra argument as in

```js

const parsed = CommandParser.parse(

args,

new  NaturalNumberParser()

new  OrParser(

new  MapParser(),

new  MapDifficultyParser(),

new  EmptyParser(),

)

)

```

That is to say that the following are all valid

`q!<command> 1 cube`

`q!<command> 1 beginner`

`q!<command> 1` (<-- This is what the `EmptyParser` allows!).

Note that in the worst case scenario, you can avoid using all abstract parsers but the `OrParser` in the following way:

```js

parsingOption1 = [new  RoundParser(),  new  ModeParser],

parsingOption2 = [new  RoundParser()]

parsingOption3 = [new  ModeParser(),  new  RoundParser()]

...



const parsed = CommandParser.parse(

args,

new  NaturalNumberParser()

new  OrParser(

parsingOption1,

parsingOption2,

parsingOption3,

...

)

)

```

this sort of structure would allow you to skip using `OptionalParser` and `AnyOrderParser` and might make smaller use cases easier to reason about. However, once you start writing large and more complex ones, you probably won't want to be replacing `AnyOrderParser`s, which can save you from writing out possibly dozens of different acceptance cases.

<a  name="parsed"></a>

### "Parsed"

`parsed` is the return-value of `CommandParser.parse`. It will be of type `Parsed`, for which you can read through the implementation [here](https://github.com/rmlgaming/cyberquincy/blob/master/parser/parsed.js)

Looking back at [example #1](#utilization-example-1), you should be able to access `parsed.map` to get back the map that the user entered; `parsed.cash` for `CashParser`; `parsed.natural_number` for `NaturalNumberParser`, etc. It will be made more explicit later on what to expect `parsed.{value}` to be when you have `{Value}Parser`.

Note that if you, the command developer, pass in let's say 2 rounds like so:

```js
parsed = CommandParser.parse(args, new RoundParser(), new RoundParser());
```

`parsed.round` will only give you the latest (in this case) the second round parsed. In order to get a list of all parsed rounds, just use `parsed.rounds` (plural). If you want them from lowest to highest just write

```js
parsed = CommandParser.parse(args, new RoundParser(), new RoundParser());

rounds = parsed.rounds.sort; // parsed.rounds is just a list so you can run .sort on it
```

Before you try to access any of the `parsed` fields, you should check for parsing errors.

```js
if (parsed.hasErrors()) {
    // Do something here like report errors back to user and don't continue with the command

    return message.channel.send(`Error: ${parsed.parsingErrors.join('\n')}`);
}
```

<a  name="parser-structure"></a>

## Parser Structure

As a reminder, there are 2 types of parsers: abstract parsers (`OrParser`, `OptionalParser`, `AnyOrderParser`, etc) and concrete parsers (map, mode, hero, difficulty, number, round, cash, etc...). This illustration will only be focused on concrete parsing structure because it's super unlikely you'll want to/need to write an abstract parser.

-   example: `CashParser`

```js
const NumberParser = require('./number-parser.js');

// Looks for a round number, permitting natural numbers based on the difficulty provided to the constructor.

// Discord command users can provide the round in any of the following forms:

// - 15, r15, round15

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

return  'cash';

}



```

`type()` defines how to access the Parser's resulting value once parsing completes. In this case, since the cash parser has set `type()` to be `cash`, you use `parsed.cash` to get the cash amount that was found in the user's command arguments.

### constructor()

```js

constructor(low=0, high=Infinity) {

this.delegateParser  =  new  NumberParser(low,  high);

}

```

`constructor()` is the initializing method for when the parser gets created. In most of the examples shown, this happens in the `CommandParser.parse` call. It pretty much just looks like `new ThingParser()`. In the case of Parsers, it's good for allowing the command _developer_ to further restrict values beyond what they're already restricted to. For example, as a developer you can write a command that accepts a cash value but no more than 100,000:

```js
parsed = CommandParser.parse(args, CashParser(0, 100000));
```

### parse()

```js

parse(arg) {

// Convert `$5` to just `5`

arg  =  this.transformArgument(arg);

return  this.delegateParser.parse(arg);

}



// Parses all ways the command user could enter a round

transformArgument(arg) {

if (arg[0] ==  '$') {

return  arg.slice(1);

}  else  if (/\d|\./.test(arg[0])) {

return  arg;

}  else  {

throw  new  UserCommandError(

`Cash must be of form \`15\` or \`$15\` (Got \`${arg}\` instead)`

);

}

}

```

`parse()` does the actual parsing, though it usually calls upon the `this.delegateParser`. A delegate parser is a tool you can use to take advantage of existing parsers so your new parser doesn't have to do too much work. For example, a cash parser is just a number that can take in commas to separate thousands places and a `$` beforehand to allow the user to be most explicit. By utilizing the number parser, you don't have to worry about the user entering `abcd` because the `NumberParser` will throw an error for you. In the above example, the cash value is stripped of commas and a preceding dollar sign (achieved in the method `transformArgument`) before it's passed to be validated by the delegate `NumberParser`.

<a  name="simplified"></a>

## All of the Above in Simpler Terms

So you know how commands can take a long list of arguments? It's in the array `args`. The parser basically helps to parse all that raw user input.

First you define a variable. In the example above its called `parsed` and you let that be `CommandParser.parse()`.

You first put `args` inside the function. Then you put in your parsers. How? Lets say you want an optional parser for a mode, e.g. like in `q!income`; you don't _need_ a mode, but the mode matters. you then put in `new OptionalParser()` into the function.

The function should look something like this:

```js
let parsed = CommandParser.parse(args, new OptionalParser());
```

In the new `OptionalParser()` it accepts 2 things, a parser and a "fallback option". So for example

```js
new OptionalParser(new ModeParser('CHIMPS', 'ABR', 'HALFCASH'), 'CHIMPS');
```

means that this `OptionalParser()` has `ModeParser()` as its parser, and if the parser can't find that mode, it resorts to the second input, in this case `'CHIMPS'`.

We can add more parsers inside the `parse()` function. In this case we would like to know the round (compulsory), so we add `newRoundParser('IMPOPPABLE')`. What this does is check whether the round provided fits into the impoppable gamemode criteria, i.e. whether or not `6<=round<=100`

So far, it should look something like this:

```js
parsed = CommandParser.parse(
    args,

    new OptionalParser(new ModeParser('CHIMPS', 'ABR', 'HALFCASH'), 'CHIMPS'),

    new RoundParser('IMPOPPABLE')
);
```

that is essentially it. There is just a few more steps:

1. Allow the user to enter the command arguments in any order (so mode then round OR round then mode):

```js
parsed = CommandParser.parse(
    args,

    new AnyOrderParser(
        new OptionalParser(
            new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),

            'CHIMPS'
        ),

        new RoundParser('IMPOPPABLE')
    )
);
```

2. Catch any errors

```js
parsed = CommandParser.parse(
    args,

    new AnyOrderParser(
        new OptionalParser(
            new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),

            'CHIMPS'
        ),

        new RoundParser('IMPOPPABLE')
    )
);

if (parsed.hasErrors()) {
    // Return a message to the command user with a new-line separated list of parsing errors

    return message.channel.send(`Error: ${parsed.parsingErrors.join('\n')}`);
}
```

You can access the mode inputted by using `parsed.mode` at the end:

```js
parsed = CommandParser.parse(
    args,

    new AnyOrderParser(
        new OptionalParser(
            new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),

            'CHIMPS'
        ),

        new RoundParser('IMPOPPABLE')
    )
);

if (parsed.hasErrors()) {
    // Return a message to the command user with a new-line separated list of parsing errors

    return message.channel.send(`Error: ${parsed.parsingErrors.join('\n')}`);
}

return message.channel.send(
    `mode inputted is ${parsed.mode}, round inputted is ${parsed.round}`
);
```

and that's it! You've not only ensured that the commands you run are "safe", but you've also given the user opportunities to learn from entering incorrectly-formatted commands!

<a  name="appendix"></a>

## Appendix

<a  name="parser-library"></a>

### Parser Library Glimpse

| Parser              | Description                                                                    | developer inputs                                                                                                                          | user inputs                                   |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| RoundParser         | Utilizes `NaturalNumberParser` to parse a round number (limited by difficulty) | "IMPOPPABLE", "HARD", "MEDIUM", "EASY", "ALL"                                                                                             | 15, R15, round15                              |
| NaturalNumberParser | Parses a positive integer between `low` and `high`                             | `(6, 10)`, `(-Infinity, 0)`, ...                                                                                                          | 1, 2, 3, 4, 5...                              |
| ModeParser          | Parses a Btd6 Gamemode                                                         | "STANDARD","PRIMARYONLY","DEFLATION","MILITARYONLY", "APOPALYPSE","REVERSE","MAGICONLY","DOUBLEHP","HALFCASH","ABR","IMPOPPABLE","CHIMPS" | Same as developer inputs (case doesnt matter) |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
|                     |                                                                                |                                                                                                                                           |                                               |
