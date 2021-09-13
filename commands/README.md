# command class

[read the discord.js guide until here](https://discordjs.guide/command-handling/adding-features.html#command-aliases)

## required

`name`: the main name of the tower. A string
`async execute()`: the main function. Has 3 inputs:

```js
execute(message, args, commandName);
```

message: the same message object/snowflake in the `client.on('message', (message))`
args/commandName: all the arguments/inputs: `q!commandName args[0] args[1] args[2] ...` (args is an array of strings)

> NOTE: the args will be automatically converted to the argument alias in `./aliases` disable with `rawArgs`

## optional

`aliases`: array of strings that are alternatives to running the command

`depencies`: an array for whether you need btd6index (and previously topper's data)
e.g.:

```js
depencies: ['btd6index', 'towerJSON'];
```

`rawArgs`: a boolean value to see if you want the args to converted to "standard form" or not
