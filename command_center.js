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
        let args = c.slice(PREFIX.length).split(/ +/);

        // The command name is the first token; args are the rest
        const commandName = args.shift();

        // exception: check with they inputted a path as the commandName
        if (Towers.isValidUpgradeSet(commandName)) {
            return message.channel.send(`its q!${args[0]} <path>`);
        }
        // Search through command names taking into account their aliases
        let command =
            client.commands.get(commandName) ||
            client.commands.find(
                (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
            );

        let lang = 'en';

        // russian
        if (
            message.channel.topic &&
            message.channel.topic.toLowerCase().includes('<ru>') &&
            command.languages.includes('ru')
        ) {
            lang = 'ru';
        }

        if (!command) {
            return;
        }
        let canonicalArgs = null;

        // doesnt lowerCase the arguments
        if (command.casedArgs) {
            let content = message.content.slice(PREFIX.length);
            dummy = content.split(/ +/);
            dummy.shift();
            args = dummy;
        }

        // rawArgs => no getting arg-alias-parsed
        if (command.rawArgs) {
            // If the command specifies that the arguments should come in raw, don't canonicize them
            canonicalArgs = args;
        } else {
            // Each item in [args] either looks like `arg` or `argp1#argp2`
            // This converts each arg part to its canonical form.
            // `spact#025` gets converted to `spike_factory#025` for example.
            canonicalArgs = args.map((arg) =>
                Aliases.canonicizeArg(arg.toLowerCase())
            );
        }

        // Keeps track of cooldowns for commands/users and determines if cooldown has expired
        if (!Cooldowns.handleCooldown(command, message)) return;

        if (command.dependencies) {
            if (command.dependencies.includes('btd6index')) {
                let btd6index = require('./1/config.json')['btd6index'];
                if (!btd6index) {
                    return message.channel.send('This command is disabled');
                }
            }
            if (command.dependencies.includes('towerJSON')) {
                let towerJSON = require('./1/config.json')['towerJSON'];
                if (!towerJSON) {
                    return message.channel.send('This command is disabled');
                }
            }
            if (command.dependencies.includes('reddit')) {
                let reddit = require('./1/config.json')['reddit'];
                if (!reddit) {
                    return message.channel.send('This command is disabled');
                }
            }
        }
        command.execute(message, canonicalArgs, commandName, lang);

        // Don't want the user gaining xp from metacommands
        if (!XPCOMMANDS.includes(command.name) && xpEnabled) {
            Xp.addCommandXp(message);
        }
        // post information to statcord
        const botposting = require('./1/config.json')['botposting'];

        if (statcord !== undefined && botposting === true) {
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
