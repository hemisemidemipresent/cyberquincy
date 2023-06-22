fs = require('fs');

function commandFiles() {
    const commandFiles = fs.readdirSync('./slash_commands').filter((file) => file.endsWith('.js'));
    return commandFiles.map((file) => require(`./slash_commands/${file}`));
}

function configureCommands(client) {
    client.commands = new Discord.Collection();

    for (const command of commandFiles()) {
        // Set a new item in the commands Collection
        // With the key as the command name and the value as the exported module
        try {
            client.commands.set(command.data.name, command);
        } catch (e) {
            console.log('Error setting slash command: you probably have an invalid .js file in ./slash_commands/');
        }
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

async function handleSelectMenu(interaction) {
    try {
        const command = client.commands.get(interaction.message.interaction.commandName);

        if (!command || !command.onSelectMenu) return;

        await command.onSelectMenu(interaction);
    } catch (e) {
        console.log(e);
    }
}

function extendStructure(_class) {
    const prototype = _class.prototype;

    const deferReply = prototype.deferReply;
    prototype.deferReply = async function (options = {}) {
        options.ephemeral = this.options.getBoolean('hide') ?? Boolean(options.ephemeral);

        return deferReply.call(this, options);
    };

    const reply = prototype.reply;
    prototype.reply = async function (options) {
        const ephemeral = this.options.getBoolean('hide') ?? Boolean(options.ephemeral);
        options = {
            ...(typeof options === 'object' ? options : { content: options }),
            ephemeral
        };

        const message = await (this.deferred || this.replied ? this.followUp(options) : reply.call(this, options));

        this.replied = true;

        return message;
    };
}

module.exports = {
    commandFiles,
    configureCommands,
    handleCommand,
    handleButton,
    handleAutocomplete,
    handleSelectMenu,
    extendStructure
};
