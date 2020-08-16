# Cyber Quincy

[![CodeFactor](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy/badge)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy)

Cyber Quincy is a btd6 discord bot.

### links

-   [discord server](https://discord.gg/VMX5hZA) (join for bot updates and online/offline status)
-   [invite link](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881)
-   [website](https://cq.netlify.com)

**for help, simply use `q!help`**

###### Note: the 'Advertisments' you see here and in the code aren't for money, they just "advertise" the discord server and invite link. I can't think of a better name

# Basic local test guide

> note: all credentials will be in `./1/config.json`, fill in the json accordingly

1. make a new discord bot in [discord dev page](https://discord.com/developers/applications) and make a new application and hence bot (and token)

2. you need credentials for google-spreadsheet (I reccomend [Thie video to set up credentials](https://www.youtube.com/watch?v=UGN6EUi4Yio) and paste the credentials in `./1/config.json`), not necessary if you arent using google spreadsheets in any way.

3. to run type `node server` (this sets up a `database.sqlite` file)

# npm dependencies

-   `express` every node.js project has one of these, even though this isn't used here
-   `discord.js` what makes this bot work
-   `google-spreadsheet` I need this to get information from [BTD6 Index](https://docs.google.com/spreadsheets/d/1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA/edit#gid=0) [Misc Challenges](https://docs.google.com/spreadsheets/d/1tOcL8DydvslPHvMAuf-FAHL0ik7KV4kp49vgNqK_N8Q/edit#gid=2028069799)
-   `node-fetch` module for assesing [popology source](http://topper64.co.uk/nk/btd6/dat/towers.json)
-   `sequelize` (DB)
-   `sqlite3` (DB dialect)
-   `sequelize-cli` if you want to make changes (or migrations or something) to the database, (al)though you shouldn't be, just suggest something in this discord instead. If you are interested look at `./migrations`, and check [this guide](https://dev.to/nedsoft/add-new-fields-to-existing-sequelize-migration-3527)
-   `pluralize` used in parser

## how commands are processed

-   first, it starts in `generateListeners()` in `server.js`
-   then it is processed in `command_center.js`
-   it is then executed using `command.execute(message, args);`, using `module.exports`
-   then the DB stuff and ad stuff happens back in `command_center.js`

commands are using node.js `module.exports`

there is a command arguments parser, [check it out](https://github.com/hemisemidemipresent/cyberquincy/tree/master/parser)

# database fields

(I think they are called fields)

-   `xp` - user xp
-   `level` - isn't really used since you can reverse-engineer the level from xp
-   `showAds` - setting for turning on/off the ads in `./helpers/advertisments.js`
-   `showLevelUpMsg` - setting for turning on/off level up messages in `./helpers/xp.js`
-   `quiz` - how many q!quiz questions they answered correctly
-   `freezexp` - unused but

# application information

-   this bot is made using `discord.js`
-   commands can be found in the `commands` folder.
-   the start script is `server.js`
-   the sequelize config file is `./config`
-   the other credentials are in `./1/config.json`
