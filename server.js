const botInfoHelper = require('./helpers/botinfo');
const { Client, Intents } = require('discord.js');

function main() {
    pingHeroku();
    globalRequirements();
    consoleBootup();
    googleSheetsInitialization();
    configureAliases();
    commandCenter = configureCommands();
    generateListeners(commandCenter);
    botStats();
    login();
}

function pingHeroku() {
    let isTesting = require('./1/config.json')['testing'];
    if (isTesting) return;
    const express = require('express');

    // this part is to keep the project going
    const app = express();
    app.use(express.static('public'));
    app.get('/', (request, response) => {
        let d = new Date(Date.now());
        d.toString();
        console.log(`[PING] at ${d}`);
        response.sendStatus(200);
        console.log(process.env.PORT);
    });
    app.listen(process.env.PORT);
}
function globalRequirements() {
    global.colours = require('./jsons/colours.json');
    global.b = require('./helpers/bloons-general');
    global.Towers = require('./helpers/towers.js');
    global.Files = require('./helpers/files.js');
    global.AliasRepository = require('./alias-repository.js');

    global.Discord = require('discord.js');
    global.client = new Client({
        intents: [
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        ],
    });

    global.prefix = require('./1/config.json')['prefix'];

    global.Cooldowns = require('./helpers/cooldowns.js');
    global.CommandParser = require('./parser/command-parser.js');

    global.UserCommandError = require('./exceptions/user-command-error.js');
    global.DeveloperCommandError = require('./exceptions/developer-command-error.js');

    //global.Xp = require('./helpers/xp.js');
    //global.DiscordUsers = require('./helpers/discord-users.js');

    //global.xpEnabled = true;
}

function consoleBootup() {
    client.once('ready', () => {
        client.user.setPresence({
            activity: {
                name: `${prefix}help`,
            },
            status: 'online',
        });
        console.log('<Program Directive> Discord Bot Client is ready');
        const botposting = require('./1/config.json')['botposting'];
        if (!botposting) {
            global.statcord = undefined;
            return;
        }
        const Statcord = require('statcord.js');
        let statcordKey = require('./1/config.json')['statcord'];
        if (!statcordKey || statcordKey === 'no') {
            console.log('[INFO] statcord is not configured');
            return;
        }
        const statcord = new Statcord.Client({
            client,
            key: statcordKey,
        });
        statcord.autopost();
        statcord.on('autopost-start', () => {
            // Emitted when statcord autopost starts
            console.log('[POST] started autopost');
        });

        statcord.on('post', (status) => {
            // status = false if the post was successful
            // status = "Error message" or status = Error if there was an error
            if (!status) {
                //console.log('[POST] successful Statcord post');
            } else console.error(status);
        });
        statcord.autopost().catch((error) => {
            console.log(error);
            console.error('[ERROR] Something is wrong with statcord autopost');
        });

        // Make available globally
        global.statcord = statcord;
    });
}

async function googleSheetsInitialization() {
    let btd6index = require('./1/config.json')['btd6index'];
    if (!btd6index) return;

    const GoogleSheetsHelper = require('./helpers/google-sheets.js');
    // Load the BTD6 Index
    global.Btd6Index = await GoogleSheetsHelper.load(
        GoogleSheetsHelper.BTD6_INDEX_KEY
    );
    console.log('<INITIATE> Btd6 Index has been loaded');
}

function configureAliases() {
    const AliasRepository = require('./alias-repository.js');
    global.Aliases = new AliasRepository();
    Aliases.asyncAliasFiles();
}

function configureCommands() {
    commandCenter = require('./command_center');
    commandCenter.configureCommands(client);
    return commandCenter;
}

function generateListeners(commandCenter) {
    global.Guilds = require('./helpers/guilds.js');

    client.on('guildCreate', (guild) => {
        return Guilds.enterGuild(guild);
    });
    client.on('guildMemberAdd', async (member) => {
        return Guilds.addMember(member);
    });
    client.on('guildMemberRemove', async (member) => {
        return Guilds.removeMember(member);
    });
    client.on('messageCreate', async (message) => {
        commandCenter.handleCommand(message);
    });
}

function botStats() {
    statcord();
    botInfoHelper.discordbotlist();
}

function login() {
    let isTesting = require('./1/config.json')['testing'];
    let token = '';
    if (isTesting) {
        token = require('./1/config.json')['testToken'];
    } else {
        token = require('./1/config.json')['token'];
    }
    client.login(token);
}

main();

function statcord() {}
