// registers slash commands
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { activeToken, activeClientID } = require('./helpers/config');
const { testing, testingGuild } = require('./1/config.json');

async function loadAliases() {
    const AliasRepository = require('./alias-repository.js');
    global.Aliases = new AliasRepository();
    await Aliases.asyncAliasFiles();
}

async function registerCommands() {
    await loadAliases();

    slashCommandCenter = require('./slash_command_center');

    const rest = new REST({ version: '9' }).setToken(activeToken());
    if (testing) {
        const commands = slashCommandCenter
            .commandFiles()
            //.filter((file) => !file.beta)
            .map((file) => file.data.toJSON());
        await rest
            .put(Routes.applicationGuildCommands(activeClientID(), testingGuild), { body: commands })
            .then(() => console.log('Successfully registered application commands for test guild.'))
            .catch(console.error);
    } else {
        const commands = slashCommandCenter
            .commandFiles()
            .filter((file) => !file.beta)
            .map((file) => file.data.toJSON());
        await rest
            .put(Routes.applicationCommands(activeClientID()), { body: commands })
            .then(() => console.log('Successfully registered application commands for all guilds.'))
            .catch(console.error);

        const betaCommands = slashCommandCenter
            .commandFiles()
            .filter((file) => file.beta)
            .map((file) => file.data.toJSON());
        await rest
            .put(Routes.applicationGuildCommands(activeClientID(), testingGuild), { body: betaCommands })
            .then(() => console.log('Successfully registered beta commands for test guild.'))
            .catch(console.error);
    }
}

registerCommands();
