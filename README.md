# Cyber Quincy

[![CodeFactor](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy/badge)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy) [![PRs](https://badgen.net/github/prs/hemisemidemipresent/cyberquincy)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy) [![stars](https://badgen.net/github/stars/hemisemidemipresent/cyberquincy)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy) [![forks](https://badgen.net/github/forks/hemisemidemipresent/cyberquincy)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy)

<img src="https://cdn.discordapp.com/attachments/764803099462205451/921251017264353329/unknown.png" width=250/>

art by [u/Projekt_Knyte](https://www.reddit.com/r/btd6/comments/f8rm5w/so_i_havent_drawn_cyber_quincy_yet/)

Cyber Quincy is the most polished BTD6 discord bot from providing information on towers, hero, rounds, maps, as well as calculating cash from rounds and hero levelling. (and more)

### Links

-   [discord server](https://discord.gg/VMX5hZA) (join for bot updates and online/offline status)
-   [invite link](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617)
-   [website](https://cq.netlify.com)

**For help, simply use `q!help`**

# Basic local test guide

> note: all credentials will be in `./1/config.json`, fill in the json accordingly.

1. make a new discord bot in [discord dev page](https://discord.com/developers/applications), and copy the token into `./1/config.json` as `token`.

2. you need credentials for google-spreadsheet (I recommend [this video to set up credentials](https://www.youtube.com/watch?v=UGN6EUi4Yio) and paste the credentials in `./1/config.json`). (Not strictly necessary, but many commands require it.)

3. Optional:

    - [add bot to statcord](https://statcord.com/add), and copy the key into `./1/config.json` as `statcord`
    - ~~[add bot to discordbotlist](https://discordbotlist.com), and copy the auth token into `./1/config.json` as `discordbotlist`~~

4. to register slash commands type `node register`

5. to run type `node server`

# Contributing Guidelines

-   try to use `camelCase`
-   don't use `var` to define variables. JS is weird enough
-   try not to do too much at once (for pull requests)
-   util functions/classes/modules _should_ go to `./helpers` (unless they are specific to only one command)
-   [how the bot generally works](./ARCHITECHTURE.md)
