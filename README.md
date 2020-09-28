# Cyber Quincy

[![CodeFactor](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy/badge)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy) [![PRs](https://badgen.net/github/prs/hemisemidemipresent/cyberquincy)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy) [![stars](https://badgen.net/github/stars/hemisemidemipresent/cyberquincy)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy) [![forks](https://badgen.net/github/forks/hemisemidemipresent/cyberquincy)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy)

Cyber Quincy is a BTD6 Discord bot.

### Links

-   [discord server](https://discord.gg/VMX5hZA) (join for bot updates and online/offline status)
-   [invite link](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881)
-   [website](https://cq.netlify.com)

**For help, simply use `q!help`**

> note: the 'Advertisements' you see here and in the code aren't for money, they just "advertise" the discord server and invite link. I can't think of a better name.

# Basic local test guide

> note: all credentials will be in `./1/config.json`, fill in the json accordingly.

1. make a new discord bot in [discord dev page](https://discord.com/developers/applications), and copy the token into `./1/config.json` as `token`.

2. you need credentials for google-spreadsheet (I recommend [this video to set up credentials](https://www.youtube.com/watch?v=UGN6EUi4Yio) and paste the credentials in `./1/config.json`). (Not strictly necessary, but many commands require it.)

3. Optional:

    - [add bot to statcord](https://statcord.com/add), and copy the key into `./1/config.json` as `statcord`
    - [add bot to discordbotlist](https://discordbotlist.com), and copy the auth token into `./1/config.json` as `discordbotlist`

4. to run type `node server` (this sets up a `database.sqlite` file).

# npm dependencies

-   `discord.js` what makes this bot work
-   `node-fetch` for accessing [popology source](http://topper64.co.uk/nk/btd6/dat/towers.json)
-   `sequelize` DB
-   `sqlite3` DB dialect
-   `pluralize` used in parser
-   `filepath` used in alias reopsitory

## Used, but technically optional

-   `express` used to receive pings to keep app awake
-   `google-spreadsheet` to get information from [BTD6 Index](https://docs.google.com/spreadsheets/d/1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA/edit#gid=0) and [Misc Challenges](https://docs.google.com/spreadsheets/d/1tOcL8DydvslPHvMAuf-FAHL0ik7KV4kp49vgNqK_N8Q/edit#gid=2028069799)
-   `statcord` used for [bot statistics](https://statcord.com/bot/591922988832653313)

## Optional

-   `bufferutil` for a much faster WebSocket connection
-   `utf-8-validate` in combination with bufferutil for much faster WebSocket processing
-   `sequelize-cli` if you want to make changes (or migrations or something) to the database, (al)though you shouldn't be preferably, just suggest something instead. If you are interested check [this guide](https://dev.to/nedsoft/add-new-fields-to-existing-sequelize-migration-3527) (this makes a `./migrations` folder)

# Database fields

(I think they are called fields)

-   `xp` - user xp
-   `level` - isn't really used since you can reverse-engineer the level from xp
-   `showAds` - setting for turning on/off the ads in `./helpers/advertisments.js`
-   `showLevelUpMsg` - setting for turning on/off level up messages in `./helpers/xp.js`
-   `quiz` - how many q!quiz questions they answered correctly
-   `freezexp` - unused

# Contributing Guidelines

-   try to use camelCase
-   dont use `var` to define variables. JS is weird enough
-   try not to do too much at once
