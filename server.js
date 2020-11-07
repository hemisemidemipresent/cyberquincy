const botInfoHelper = require('./helpers/botinfo');

function main() {
    pingHeroku();
    globalRequirements();
    consoleBootup();
    dbSetup();
    googleSheetsInitialization();
    towerJSONinit();
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
    });
    app.listen(process.env.PORT);
}

function globalRequirements() {
    global.colours = require('./jsons/colours.json');
    global.h = require('./helpers/general.js');
    global.Files = require('./helpers/files.js');
    global.AliasRepository = require('./alias-repository.js');

    global.Discord = require('discord.js');
    global.client = new Discord.Client();

    global.prefix = require('./1/config.json')['prefix'];

    global.Cooldowns = require('./helpers/cooldowns.js');
    global.CommandParser = require('./parser/command-parser.js');

    global.UserCommandError = require('./exceptions/user-command-error.js');
    global.DeveloperCommandError = require('./exceptions/developer-command-error.js');

    global.Xp = require('./helpers/xp.js');
    global.DiscordUsers = require('./helpers/discord-users.js');

    global.xpEnabled = true;
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
    });
}

function dbSetup() {
    const { Sequelize, Model, DataTypes } = require('sequelize');
    global.sequelize = new Sequelize('database', 'user', 'password', {
        host: 'localhost',
        dialect: 'sqlite',
        logging: false,
        storage: 'database.sqlite',
    });

    global.Tags = sequelize.define('tags', {
        name: {
            type: Sequelize.INTEGER,
            unique: true,
            primaryKey: true,
        },
        xp: Sequelize.INTEGER,
        showAds: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
        },
        xpFreezed: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
        },
        showLevelUpMsg: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
        },
    });
    Tags.sync();
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
async function towerJSONinit() {
    let bool = require('./1/config.json')['towerJSON'];
    if (!bool) return;
    const fetch = require('node-fetch');
    const url = 'http://topper64.co.uk/nk/btd6/dat/towers.json';
    const settings = { method: 'Get' };
    fetch(url, settings)
        .then((res) => res.json())
        .then((json) => {
            global.towerJSON = json;
            console.log("<Eradicate Bloons> Topper's JSON is loaded");
        })
        .catch(() => {
            console.log(
                "[ERROR] Something is wrong with fetching topper's json"
            );
        });
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
    client.on('message', async (message) => {
        commandCenter.handleCommand(message);
    });
}

function botStats() {
    botInfoHelper.statcord();
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
