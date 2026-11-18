const { Client, GatewayIntentBits, InteractionType, ChatInputCommandInteraction } = require('discord.js');

function main() {
    globalRequirements();
    consoleBootup();
    slashCommandCenter = setupSlashCommandCenter();
    generateCommandListeners(slashCommandCenter);
    login();
}

function globalRequirements() {
    global.Discord = require('discord.js');
    global.client = new Client({
        intents: [GatewayIntentBits.Guilds]
    });

    global.UserCommandError = require('./exceptions/user-command-error.js');
    global.DeveloperCommandError = require('./exceptions/developer-command-error.js');
}

function consoleBootup() {
    client.once('clientReady', () => {
        client.user.setPresence({
            activity: {
                name: `/help`
            },
            status: 'online'
        });
        console.log('<Program Directive> Discord Bot Client is ready');
    });
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
