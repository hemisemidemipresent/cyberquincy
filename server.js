const { Client, GatewayIntentBits, InteractionType, ChatInputCommandInteraction } = require('discord.js');

function main() {
    pingHeroku();
    globalRequirements();
    consoleBootup();
    googleSheetsInitialization();
    configureAliases();
    // commandCenter = configureCommands();
    slashCommandCenter = setupSlashCommandCenter();
    generateCommandListeners(slashCommandCenter);
    login();
}

function pingHeroku() {
    let isTesting = require('./1/config.json')['testing'];
    if (isTesting) return;

    const express = require('express');

    // this part is to keep the project going
    const app = express();
    //    app.use(express.static('public'));
    app.get('/', (request, response) => {
        let d = new Date(Date.now());
        d.toString();
        response.sendStatus(200);
    });
    app.listen(process.env.PORT || 3000);
}
function globalRequirements() {
    global.colours = require('./jsons/colours.json');
    global.Towers = require('./helpers/towers.js');
    global.AliasRepository = require('./alias-repository.js');

    global.Discord = require('discord.js');
    global.client = new Client({
        intents: [GatewayIntentBits.Guilds]
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
                name: `${prefix}help`
            },
            status: 'online'
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
            key: statcordKey
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
            console.log(error.name);
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
    global.Btd6Index = await GoogleSheetsHelper.load(GoogleSheetsHelper.BTD6_INDEX_KEY);
    console.log('<INITIATE> Btd6 Index has been loaded');
}

function configureAliases() {
    const AliasRepository = require('./alias-repository.js');
    global.Aliases = new AliasRepository();
    Aliases.asyncAliasFiles();
}

// function configureCommands() {
//     commandCenter = require('./command_center');
//     commandCenter.configureCommands(client);
//     return commandCenter;
// }

function setupSlashCommandCenter() {
    slashCommandCenter = require('./slash_command_center');
    slashCommandCenter.configureCommands(client);
    slashCommandCenter.extendStructure(ChatInputCommandInteraction);
    return slashCommandCenter;
}

function generateCommandListeners(slashCommandCenter) {
    global.Guilds = require('./helpers/guilds.js');

    client.on('guildCreate', (guild) => {
        return Guilds.enterGuild(guild);
    });

    // q! commands - no longer exist as of August 2022 due to Discord making bots changes to slash commands
    // and this bot doesnt have a valid reason to be using message content so we do not have this intent
    // * https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Privileged-Intent-FAQ
    // client.on('messageCreate', async (message) => {
    //    commandCenter.handleCommand(message);
    // });

    // slash commands
    client.on('interactionCreate', async (interaction) => {
        if (interaction.type === InteractionType.ApplicationCommand) slashCommandCenter.handleCommand(interaction);
        if (interaction.isButton()) slashCommandCenter.handleButton(interaction);
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete)
            slashCommandCenter.handleAutocomplete(interaction);
        if (interaction.isSelectMenu()) slashCommandCenter.handleSelectMenu(interaction);
    });
}

function login() {
    const { ActivityType } = require('discord.js');
    configHelper = require('./helpers/config');
    const activeToken = configHelper.activeToken();
    client.login(activeToken).then(() => {
        client.user?.setActivity('/help', { type: ActivityType.Listening });
    });
}

try {
    main();
} catch (e) {
    console.log(e);
}
