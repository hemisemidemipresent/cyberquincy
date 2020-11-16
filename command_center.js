const fs = require('fs');
const secrets_config = require('./1/config.json');
const Advertisements = require('./helpers/advertisements.js');

const PREFIX = secrets_config['prefix'];
const XPCOMMANDS = ['level', 'setxp', 'deletexp', 'freezexp', 'resumexp'];

const { discord } = require('./aliases/misc.json');

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

        // check for pings
        if (c.includes('<@&591922988832653313>')) {
            command = client.commands.get('help');
            return command.execute(message, args, 'help');
        }

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
        let command;
        // exception: check with they inputted a path as the commandName
        if (Towers.isValidUpgradeSet(commandName)) {
            command =
                client.commands.get(args[0]) ||
                client.commands.find(
                    (cmd) => cmd.aliases && cmd.aliases.includes(args[0])
                );

            if (!command) {
                return;
            }
        } else {
            // Search through command names taking into account their aliases
            command =
                client.commands.get(commandName) ||
                client.commands.find(
                    (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
                );
        }
        if (!command) {
            return;
        }
        let canonicalArgs = null;
        if (command.rawArgs) {
            // If the command specifies that the arguments should come in raw, don't canonicize them
            canonicalArgs = args;
        } else {
            // Each item in [args] either looks like `arg` or `argp1#argp2`
            // This converts each arg part to its canonical form.
            // `spact#025` gets converted to `spike_factory#025` for example.
            canonicalArgs = args.map((arg) => Aliases.canonicizeArg(arg));
        }

        // Keeps track of cooldowns for commands/users and determines if cooldown has expired
        if (!Cooldowns.handleCooldown(command, message)) return;
        if (Towers.isValidUpgradeSet(commandName)) {
            let inputs = [commandName];
            command.execute(message, inputs, args[0]);
        } else {
            if (command.dependencies) {
                if (command.dependencies.includes('btd6index')) {
                    let btd6index = require('./1/config.json')['btd6index'];
                    if (!btd6index) {
                        return message.channel.send('This command is disabled');
                    }
                }
                if (command.dependencies.includes('towerJSON')) {
                    let btd6index = require('./1/config.json')['towerJSON'];
                    if (!btd6index) {
                        return message.channel.send('This command is disabled');
                    }
                }
            }
            command.execute(message, canonicalArgs, commandName);
        }
        // Don't want the user gaining xp from metacommands
        if (!XPCOMMANDS.includes(command.name) && xpEnabled) {
            Xp.addCommandXp(message);
        }
        // post information to statcord
        const botposting = require('./1/config.json')['botposting'];
        if (statcord && botposting) {
            statcord
                .postCommand(command.name, message.author.id)
                .then(() => {
                    console.log(`[POST] q!${command.name} to statcord,`);
                })
                .catch((err) => {
                    console.log(`[ERROR] q!${command.name} failed to post`);
                });
        }

        // May or may not embed an advertisement message in addition to the command output

        Advertisements.spin(message);

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
                `Please [report the bug](${discord})`
            );
        return message.channel.send(errorEmbed);
    }
}

module.exports = {
    configureCommands,
    handleCommand,
};
