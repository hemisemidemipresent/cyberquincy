const { Client, GatewayIntentBits, InteractionType, ChatInputCommandInteraction } = require('discord.js');

function main() {
    globalRequirements();
    consoleBootup();
    configureAliases();
    slashCommandCenter = setupSlashCommandCenter();
    generateCommandListeners(slashCommandCenter);
    login();
}

function globalRequirements() {
    global.Towers = require('./helpers/towers.js');
    global.Heroes = require('./helpers/heroes.js');
    global.AliasRepository = require('./alias-repository.js');

    global.Discord = require('discord.js');
    global.client = new Client({
        intents: [GatewayIntentBits.Guilds]
    });

    global.CommandParser = require('./parser/command-parser.js');

    global.UserCommandError = require('./exceptions/user-command-error.js');
    global.DeveloperCommandError = require('./exceptions/developer-command-error.js');
}

function consoleBootup() {
    client.once('ready', () => {
        client.user.setPresence({
            activity: {
                name: `/help`
            },
            status: 'online'
        });
        console.log('<Program Directive> Discord Bot Client is ready');
    });
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

    client.on('guildCreate', async (guild) => {
        try {
            return await Guilds.enterGuild(guild);
        } catch (e) {
            return; // probably Missing Permissions
        }
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
        if (interaction.isStringSelectMenu()) slashCommandCenter.handleSelectMenu(interaction);
    });
}

function login() {
    const { ActivityType } = require('discord.js');
    const configHelper = require('./helpers/config');
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
