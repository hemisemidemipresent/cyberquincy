fs = require('fs');

function commandFiles() {
    const commandFiles = fs.readdirSync('./slash_commands').filter((file) => file.endsWith('.js'));
    return commandFiles.map((file) => require(`./slash_commands/${file}`));
}

function configureCommands(client) {
    for (const command of commandFiles()) {
        // Set a new item in the commands Collection
        // With the key as the command name and the value as the exported module
        client.commands.set(command.data.name, command);
    }
}

async function handleCommand(interaction) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        try {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        } catch {
            // Unknown Interaction
        }
    }
}

async function handleAutocomplete(interaction) {
    const command = client.commands.get(interaction.commandName);

    if (!command || !command.onAutocomplete) return;

    try {
        await command.onAutocomplete(interaction);
    } catch {
        // do nothing
    }
}

module.exports = {
    commandFiles,
    configureCommands,
    handleCommand,
    handleAutocomplete
};
