# Cyber Quincy

[![CodeFactor](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy/badge)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy) [![PRs](https://badgen.net/github/prs/hemisemidemipresent/cyberquincy)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy) [![stars](https://badgen.net/github/stars/hemisemidemipresent/cyberquincy)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy) [![forks](https://badgen.net/github/forks/hemisemidemipresent/cyberquincy)](https://www.codefactor.io/repository/github/hemisemidemipresent/cyberquincy)

<img src="https://cdn.discordapp.com/attachments/764803099462205451/921251017264353329/unknown.png" width=250/>

art by [u/Projekt_Knyte](https://www.reddit.com/r/btd6/comments/f8rm5w/so_i_havent_drawn_cyber_quincy_yet/)

Please give the repository a ⭐️!

Cyber Quincy is the most polished BTD6 discord bot from providing information on towers, hero, rounds, maps, as well as calculating cash from rounds and hero levelling. (and more)

### Links

-   [discord server](https://discord.gg/VMX5hZA) (join for bot updates and online/offline status)
-   [invite link](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617)
-   [website](https://cq.netlify.com)

**For help, simply use `/help`**

# Basic local test guide

> note: all credentials will be in `./1/config.json` (you need to create this file yourself), fill in the json accordingly (as per `./1/template.json`).

1. make a new discord bot in [discord dev page](https://discord.com/developers/applications), and copy the token into `./1/config.json` as `token`.

2. to register slash commands type `node register`

4. to run type `node server`, or to run with sharding run `node index`

# Project Info

-   this project uses CommonJS modules (no `import` or `export`, just `require` and `module.exports`)
-   there is now ESLint for this project - there is an `.eslintrc.json` linter file now which should hopefully enforce a somewhat consistent code standard
-   to use eslint to check for errors run `npx eslint <file or directory>`. Many text editors also have integration with eslint as well.

## Project Information (Where do the numbers and stats come from)

-   Much of the data the bot uses is within the `./jsons` folder
-   Tower Information are from Extreme Bloonology and their pastebins ([Heroes](./helpers/heroes.js) and [Towers](./helpers/towers.js))
-   This bot also uses the [Official Ninja Kiwi API](https://data.ninjakiwi.com)

# Contributing Guidelines

-   try to use `camelCase`
-   don't use `var` to define variables. JS is weird enough
-   try not to do too much at once (for pull requests, split it into multiple PRs)
-   util functions/classes/modules _should_ go to `./helpers` (unless they are specific to only one command)
-   new data should go into `./jsons` if to be stored locally. Small nuggets of information are usually displayed via the `/tag` command