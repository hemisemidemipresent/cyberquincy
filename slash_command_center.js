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
    try {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;
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
async function handleButton(interaction) {
    try {
        const command = client.commands.get(interaction.message.interaction.commandName);
        if (!command || !command.onButtonClick) return;
        await command.onButtonClick(interaction);
    } catch (e) {
        console.log(e);
    }
}

async function handleAutocomplete(interaction) {
    try {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.onAutocomplete) return;
        await command.onAutocomplete(interaction);
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    commandFiles,
    configureCommands,
    handleCommand,
    handleButton,
    handleAutocomplete
};
