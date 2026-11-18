const fs = require('fs');
const { MessageFlags } = require('discord.js');
const IndexAPIError = require('./exceptions/index-api-error');
const WikiAPIError = require('./exceptions/wiki-api-error');

function commandFiles() {
    const commandFiles = fs
        .readdirSync('./slash_commands')
        .filter((file) => file.endsWith('.js') || (file.endsWith('.ts') && !file.endsWith('.d.ts')));
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
        const content =
            error instanceof IndexAPIError || error instanceof WikiAPIError
                ? error.message
                : 'There was an error while executing this command!';
        // The command may have failed at any point, so respond in whatever way the interaction's state still allows
        try {
            if (interaction.replied) {
                // Keep whatever the command already sent, and add the error below it
                await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
            } else if (interaction.deferred) {
                // Replace "thinking...". The reply keeps the visibility chosen by deferReply()
                await interaction.editReply({ content, embeds: [], components: [] });
            } else {
                await interaction.reply({ content, flags: MessageFlags.Ephemeral });
            }
        } catch {
            // Unknown Interaction, e.g. the interaction token expired
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
        const ephemeral = this.options.getBoolean('hide') ?? Boolean(options.flags & MessageFlags.Ephemeral);
        
        if (ephemeral) options.flags = MessageFlags.Ephemeral;

        return deferReply.call(this, options);
    };

    const reply = prototype.reply;
    prototype.reply = async function (options) {
        const ephemeral = this.options.getBoolean('hide') ?? Boolean(options.flags & MessageFlags.Ephemeral);
        if (ephemeral)
            options = {
                // Ensure options is an object. This is because sometimes `reply()` is called with just a string.
                ...(typeof options === 'object' ? options : { content: options }),
                // Force set ephemeral flag
                flags: options.flags |= MessageFlags.Ephemeral,
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
