# General Idea

(somewhat under construction)

if you have used discord.js before (which you should), you would know command processing begins with a message event. This starts with:
## Command processing

-   first, it starts in `generateListeners()` in `server.js`
-   then it finds the correct file and command in `command_center.js`
-   it is then executed using `command.execute(message, args);`, using `module.exports`
-   then the DB (xp) gets updated and ad stuff happens back in `command_center.js`

commands are using node.js `module.exports`, and each command is a file in `./commands`

## Parser

[How to use the parser](https://github.com/hemisemidemipresent/cyberquincy/tree/master/parser)

# Google Sheets

when the bot is first started up, the btd6 index google sheets `doc` object is "saved" or "cached". this is mainly only done in `./helpers/google-sheets.js`
