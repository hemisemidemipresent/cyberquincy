const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { activeToken, activeClientID } = require('./helpers/config');

slashCommandCenter = require('./slash_command_center');
commands = slashCommandCenter.commandFiles().map((file) => file.data.toJSON());

const rest = new REST({ version: '9' }).setToken(activeToken());

rest.put(Routes.applicationCommands(activeClientID()), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
