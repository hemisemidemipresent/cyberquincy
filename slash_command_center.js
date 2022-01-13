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

module.exports = {
    commandFiles,
    configureCommands,
}