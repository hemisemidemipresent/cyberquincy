# Cyber Quincy

Cyber Quincy is a btd6 discord bot.
useful links:

-   [discord server](https://discord.gg/VMX5hZA) (join for bot updates and online/offline status)
-   [invite link](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881)
-   [website](https://cq.netlify.com)

**for help, simply use `q!help`**

-   this bot is made using `discord.js`
-   commands can be found in the `commands` folder.
-   the start script is `server.js`

npm dependencies:

-   `express` every node.js project has one of these
-   `discord.js` what makes this bot work
-   `google-spreadsheet` I need this to get information from [BTD6 Index](https://docs.google.com/spreadsheets/d/1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA/edit#gid=0) [4tcabrrbs](https://docs.google.com/spreadsheets/d/1tOcL8DydvslPHvMAuf-FAHL0ik7KV4kp49vgNqK_N8Q/edit#gid=2028069799) and [3tcrbs](https://docs.google.com/spreadsheets/d/1tOcL8DydvslPHvMAuf-FAHL0ik7KV4kp49vgNqK_N8Q/edit#gid=2028069799)
-   `node-fetch` module for assesing [popology source](http://topper64.co.uk/nk/btd6/dat/towers.json)

commands are using node.js `module.exports`

the variable names are a mess and I apologise for them.
I am also sorry for the meaningless commit names

by hemidemisemipresent#0301

# Basic local test guide

make a new discord bot in [discord dev page](https://discord.com/developers/applications) and make a new application and hence bot (and token)

you need credentials for google-spreadsheet (I reccomend [Thie video to set up credentials](https://www.youtube.com/watch?v=UGN6EUi4Yio) and paste the credentials in `./secret/config.json`)

if you have trouble with the database there is a no-database branch
