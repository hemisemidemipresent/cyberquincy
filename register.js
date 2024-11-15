// registers slash commands
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { activeToken, activeClientID } = require('./helpers/config');
const { testing, testingGuild } = require('./1/config.json');
const { ApplicationCommandOptionType } = require('discord.js');
global.Discord = require('discord.js');

async function loadAliases() {
    const AliasRepository = require('./alias-repository.js');
    global.Aliases = new AliasRepository();
    await Aliases.asyncAliasFiles();
}

function addHideOptions(options) {
    const hasSubcommand = options.some(
        ({ type }) =>
            type === ApplicationCommandOptionType.SubcommandGroup || type === ApplicationCommandOptionType.Subcommand
    );

    if (hasSubcommand) options.forEach((option) => ((option.options ??= []), addHideOptions(option.options)));
    else
        options.push({
            name: 'hide',
            description: 'Whether to hide the response',
            type: ApplicationCommandOptionType.Boolean
        });
}

function getCommandBody(file) {
    const body = file.data.toJSON();
    body.options ??= [];

    addHideOptions(body.options);

    return body;
}

async function registerCommands() {
    await loadAliases();

    slashCommandCenter = require('./slash_command_center');

    const rest = new REST({ version: '9' }).setToken(activeToken());
    if (testing) {
        const commands = slashCommandCenter.commandFiles().map(getCommandBody);
        await rest
            .put(Routes.applicationGuildCommands(activeClientID(), testingGuild), { body: commands })
            .then(() => console.log('Successfully registered application commands for test guild.'))
            .catch(console.error);
    } else {
        const commands = slashCommandCenter
            .commandFiles()
            .filter((file) => !file.beta)
            .map(getCommandBody);
        await rest
            .put(Routes.applicationCommands(activeClientID()), { body: commands })
            .then(() => console.log('Successfully registered application commands for all guilds.'))
            .catch(console.error);

        const betaCommands = slashCommandCenter
            .commandFiles()
            .filter((file) => file.beta)
            .map(getCommandBody);
        await rest
            .put(Routes.applicationGuildCommands(activeClientID(), testingGuild), { body: betaCommands })
            .then(() => console.log('Successfully registered beta commands for test guild.'))
            .catch(console.error);
    }
}

registerCommands();
