const fs = require('fs');
const secrets_config = require('./1/config.json');
const Advertisements = require('./helpers/advertisements.js');
const AliasRepository = require('./alias-repository');

const PREFIX = secrets_config['prefix'];
const XPCOMMANDS = ['level', 'setxp', 'deletexp', 'freezexp', 'resumexp'];
const ARG_SPLITTER = '#';

function configureCommands(client) {
    client.commands = new Discord.Collection();

    // List of command files
    const commandFiles = fs
        .readdirSync('./commands')
        .filter((file) => file.endsWith('.js'));

    // Register commands
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    }
}

async function handleCommand(message) {
    try {
        //checks for bots
        if (message.author.bot) return;

        // "Normalize" message
        let c = message.content.toLowerCase();

        // Queries must begin with q!
        if (!c.startsWith(PREFIX)) return;

        // ...and have no following space (it's a common mistake)
        if (c.startsWith(PREFIX + ' ')) {
            return message.channel.send(
                'There isnt a space between q! and the command name.'
            );
        }

        // If the channel topic is set to something like no{oooo}c, then commands are blocked
        if (/no+c/i.test(message.channel.topic)) return;

        // Command tokens are space-separated tokens starting immediately after the `!`
        const args = c.slice(PREFIX.length).split(/ +/);

        // The command name is the first token; args are the rest
        const commandName = args.shift().toLowerCase();

        // Search through command names taking into account their aliases
        const command =
            client.commands.get(commandName) ||
            client.commands.find(
                (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
            );

        if (!command) {
            return;
        }

        // Each item in [args] either looks like `arg` or `argp1#argp2`
        // This converts each arg part to its canonical form.
        // `spact#025` gets converted to `spike_factory#025` for example.
        const canonicalArgs = args.map(function (arg) {
            return arg
                .split(ARG_SPLITTER)
                .map(function (t) {
                    return Aliases.getCanonicalForm(t) || t;
                })
                .join(ARG_SPLITTER);
        });

        // Keeps track of cooldowns for commands/users and determines if cooldown has expired
        if (Cooldowns.handleCooldown(command, message)) {
            command.execute(message, canonicalArgs, args, commandName);

            // Don't want the user gaining xp from metacommands
            if (!XPCOMMANDS.includes(command.name) && xpEnabled) {
                Xp.addCommandXp(message);
            }
            //post information to statcord
            const botposting = require('./1/config.json')['botposting'];
            if (statcord && botposting) {
                statcord.postCommand(command.name, message.author.id);
                console.log(
                    `Command ${command.name} by ${message.author.id} posted to statcord,`
                );
            }

            // May or may not embed an advertisement message in addition to the command output

            Advertisements.spin(message);
        }
        /* let GLOBAL_COOLDOWN_REGEX = /gcd ?= ?(\d+)/;
        regex_match = message.channel.topic.match(GLOBAL_COOLDOWN_REGEX);
        if (regex_match) {
            [_, cooldown] = regex_match;
        }*/
    } catch (error) {
        // in case of command failures
        console.error(error);
        const errorEmbed = new Discord.MessageEmbed()
            .setColor(colours['red'])
            .setDescription('Oh no! Something went wrong!')
            .addField(
                '~~I got bonked by a DDT again~~',
                'Please [report the bug](https://discord.gg/VMX5hZA)'
            );
        return message.channel.send(errorEmbed);
    }
}

module.exports = {
    configureCommands,
    handleCommand,
};
