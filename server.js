function main() {
    listenForPing();
    globalRequirements();
    consoleBootup();
    dbSetup();
    commandCenter = configureCommands();
    generateListeners(commandCenter);
    login();
}

function listenForPing() {
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

    global.Discord = require('discord.js');
    global.client = new Discord.Client();

    global.prefix = require('./secret/config.json')['prefix'];

    global.Cooldowns = require('./helpers/cooldowns.js');
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
        id: {
            type: Sequelize.INTEGER,
            unique: true,
            primaryKey: true,
        },
        xp: Sequelize.INTEGER,
        level: Sequelize.INTEGER,
    });

    Tags.sync();
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
    token = require('./secret/config.json')['token'];
    client.login(token);
}

main();
function main() {
    pingHeroku();
    globalRequirements();
    consoleBootup();
    dbSetup();
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

    global.Discord = require('discord.js');
    global.client = new Discord.Client();

    global.prefix = require('./secret/config.json')['prefix'];

    global.Cooldowns = require('./helpers/cooldowns.js');

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
    });

    Tags.sync();
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
    token = require('./secret/config.json')['token'];
    client.login(token);
}

main();
