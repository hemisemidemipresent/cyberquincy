function main() {
    pingHeroku();
    globalRequirements();
    consoleBootup();
    dbSetup();
    googleSheetsInitialization();
    configureAliases();
    commandCenter = configureCommands();
    generateListeners(commandCenter);
    login();
}

function pingHeroku() {
    const express = require('express');

    // this part is to keep the project going
    const app = express();
    app.use(express.static('public'));
    app.get('/', (request, response) => {
        console.log(Date.now() + ' Ping Received');
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
    global.ParsingError = require('./exceptions/parsing-error.js');

    global.Xp = require('./helpers/xp.js');
    global.DiscordUsers = require('./helpers/discord-users.js');

    global.xpEnabled = true;
}

function consoleBootup() {
    client.once('ready', () => {
        console.log('<Program Directive>');
        function too() {
            console.log('<Eradicate Bloons>');
        }
        setTimeout(too, 1000);
        function three() {
            console.log('<INITIATE>');
        }
        setTimeout(three, 2000);

        client.user.setActivity(`${prefix}help`);
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
    const GoogleSheetsHelper = require('./helpers/google-sheets.js');
    // Load the BTD6 Index
    global.Btd6Index = await GoogleSheetsHelper.load(GoogleSheetsHelper.BTD6_INDEX_KEY);
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
    Guilds = require('./helpers/guilds.js');

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

function login() {
    token = require('./1/config.json')['token'];
    client.login(token);
}

main();
