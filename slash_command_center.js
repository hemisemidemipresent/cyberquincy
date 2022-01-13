fs = require('fs');

function commandFiles() {
    const commandFiles = fs.readdirSync('./slash_commands').filter(file => file.endsWith('.js'));
    return commandFiles.map((file) => require(`./slash_commands/${file}`))
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
        console.log(interaction + 'HELLOOO!?!?')
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
}

module.exports = {
    commandFiles,
    configureCommands,
    handleCommand,
}