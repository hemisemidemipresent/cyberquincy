/*
DISCLAIMER: variable names are horrible here, I apologise. Try and stick to the comments as much as you can.
there are a few other pieces in the code before the message event collector. only then the code starts getting weird.
*/
const express = require('express');

// this part is to keep the project going
const app = express();
app.use(express.static('public'));
app.get('/', (request, response) => {
    console.log(Date.now() + ' Ping Received');
    response.sendStatus(200);
});
app.listen(process.env.PORT);
//it sends the "200" to <projectname>.herokuapp.com
const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./secret/config.json');
const { red, cyber, blurple, turq, green } = require('./jsons/colours.json');
const dataArray = [
    [
        'invite',
        'https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881',
    ],
    [
        'server',
        'Join this discord server to get notifications on bot updates, downtime, report bugs and to suggest features: https://discord.gg/VMX5hZA',
    ],
    [
        'add',
        'https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881',
    ],
    [
        'hack',
        'https://cdn.discordapp.com/attachments/598768278550085633/713184218598998107/hackedquincy.png',
    ],
    ['what', 'idk google it yourself'],
    ['web', 'https://cq.netlify.app'],
    ['rohan', 'I am not allowed to say anything'],
    ['nsfw', 'you are under 180 and hence banned from watching'],
    [
        'vtsg',
        'https://cdn.discordapp.com/attachments/454395715834216459/645780538803879936/PicsArt_11-17-10.37.53.jpg',
    ],
];
const client = new Discord.Client();
const noocmd = /no+c/i;
client.commands = new Discord.Collection();
const commandFiles = fs
    .readdirSync('./commands')
    .filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
function getUserFromMention(mention) {
    if (!mention) return;

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }
        //return client.users.get(mention); discord.js v11
        return client.users.cache.get(mention);
    }
}

const cooldowns = new Discord.Collection();
client.once('ready', () => {
    console.log('<Program Directive>');
    function too() {
        console.log('<Eradicate Bloons>');
    }
    setTimeout(too, 1000);
    function three() {
        console.log('<INITIATE>');
    }
    setTimeout(three, 2000);

    client.user.setActivity(`${prefix}help`);
    //dont mind these:
    //let servers = client.guilds.map(g=>g.name)
    //console.log(servers)
});

client.on('guildCreate', (guild) => {
    let channeltosend = guild.channels.cache.find(
        (channel) => channel.name.includes('general') === true
    );
    if (!channeltosend) {
        return console.log('wtf');
    } else {
        let helpEmbed = new Discord.MessageEmbed()
            .setColor(cyber)
            .setDescription(`Hi! I am Cyber Quincy. I am a btd6 discord bot.`)
            .addField(
                'general information:',
                '[List of commands](https://cq.netlify.com)\n[discord server](https://discord.gg/VMX5hZA)'
            )
            .addField(
                'note:',
                "This bot's name and avatar are (i thinked) owned by ninja Kiwi. This bot has no association with them."
            )
            .addField(
                `The by far most popular command are those that describe towers. use q!<towername> <path> for more info\n(do not type out <towername> and <path> literally. example: q!ice 005 (no more than one path at a time)`,
                `use ${prefix}info for more information`
            )
            .setFooter('have a popping day');
        channeltosend.send(helpEmbed);
    }
});
client.on('guildMemberAdd', async (member) => {
    if (member.guild.id === '598768024761139240') {
        if (member.id == '668312965664997386') {
            return;
        }
        const tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('general')
        );
        tchannel.send(
            `Welcome to the server, **${member.displayName}**. Please check the DM for more information, and read <#605712758595649566>. Thanks for joining, and the server now has **${member.guild.memberCount}** members!`
        );
        member.send(
            'Welcome to **Cyber Quincy Bot Support**! Thank you for joining!\n**Get yourself a role in <#605712758595649566>**\n\n:tools: **Found a bug?**\ncheck with <#615159685477040135>, <#616603947481694209>, <#676670780204908555> or in <#598768319625035776>.\n\n:beetle: **Found an UNKNOWN bug?**\nPlease report in <#598768319625035776>\n\n:jigsaw: **Need help or want to ask something?**\nask in<#611808489047719937> (for only the bot).\n\n:mailbox_with_mail: **Have a suggestion?**\nPlease tell us in <#598768278550085633>. Do try to be objective and feel free to be critical\n\n**Invite me to your server**:https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881\n\nThank you for joining!'
        );
    } else if (member.guild.id == 661812833771847700) {
        const wel = new Discord.MessageEmbed()
            .setTitle('Welcome to the BTD6 Index Discord Server!')
            .setThumbnail(
                'https://cdn.discordapp.com/icons/661812833771847700/94e0818cefedd71655d7e4e84a951a37.webp?size=128'
            )
            .setDescription(
                '**remember to read <#661822473246998548>!**\n**Useful external resources can be found in <#661842199679467541>**'
            )

            .addField(
                'What is the BTD6 Index?',
                'The BTD6 Index is a community-maintained spreadsheet that was created for the purpose of compiling resources, documenting challenges, and archiving additional information for BTD6. The goal is to have a vast array of game knowledge all condensed into one area for easy reference and viewing. This post breaks down what each section strives to accomplish as well as addition resources and information that might help you at the game.'
            )
            .addField(
                'related links',
                '[reddit post](https://www.reddit.com/r/btd6/comments/ejuqcj/official_btd6_index_overview/)\n[BTD6 Index](https://docs.google.com/spreadsheets/d/1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA/edit?usp=sharing)'
            )
            .addField(
                'Who am I?',
                'I am a BTD6 Discord bot. Links:\n[invite me to your server](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881),[discord server](https://discord.gg/XBhHWh9)'
            )
            .setColor(cyber);
        member.send(wel);
    } else if (member.guild.id === '543957081183617024') {
        const tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('general')
        );
        tchannel.send(
            `welcome to the only rAcE sErVer. \nIf you cant get a top 50, you have to read <#667495608155635765> 100 times before enetering`
        );
    }
});
client.on('guildMemberRemove', async (member) => {
    if (member.guild.id == '598768024761139240') {
        const tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('general')
        );
        tchannel.send(`**${member.displayName}** was lost in battle`);
    } else if (member.guild.id === '543957081183617024') {
        const tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('general')
        );
        tchannel.send(
            `**${member.displayName}** couldnt resist it and accidentally revealed that he/she is hacking races`
        );
    } else if (member.guild.id === '661812833771847700') {
        let tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('welcome')
        );
        tchannel.send(`**${member.displayName}** got nerfed. hard.`);
    }
});
client.on('message', async (message) => {
    if (message.author.bot) return; //checks for bots
    let c = message.content.toLowerCase();
    if (!c.startsWith(prefix) || noocmd.test(message.channel.topic)) return;
    const args = c.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    if (c.startsWith('q! '))
        return message.channel.send(
            'there isnt a space between q! and the command name'
        );
    if (
        commandName == 'level' ||
        commandName === 'xp' ||
        commandName === 'rank'
    ) {
        return message.channel.send(
            'Sorry! xp has been removed (temporarily) to save processing time and increase uptime.'
        );
    }
    // admin command

    if (
        commandName == 'cmdc' ||
        commandName == 'cmdcount' ||
        commandName == 'commandcount' ||
        commandName == 'commandc'
    ) {
        return message.channel.send(
            'Current count: <idk some number here>\nUnfortunately to save processing time and increase uptime, this will no longer be updated (for now'
        );
    }
    if (commandName == 'deletexp') {
        return message.channel.send(
            'xp is has been (temporarily) removed, remove your data when xp system comes back up.'
        );
    }
    if (commandName.includes('alia') || commandName.includes('nick')) {
        let command =
            client.commands.get(args[0]) ||
            client.commands.find(
                (cmd) => cmd.aliases && cmd.aliases.includes(args[0])
            ); // find the command needed
        if (!command) {
            return message.channel.send('That command/aliases doesnt exist!');
        } else {
            return message.channel.send(
                `"Original": ${command.name}\nAlternatives: ${command.aliases}`
            );
        }
    }
    // i dont think this works
    /*
  if (commandName === "top") {
    const top = await Tags.max({ attributes: ["xp"] });
    console.log(top);
  }
*/

    const command =
        client.commands.get(commandName) ||
        client.commands.find(
            (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
        ); // find the command needed
    if (!command) {
        // ahh. the pics (and spaghet)
        let content = c.slice(prefix.length);
        for (i = 0; i < dataArray.length; i++) {
            if (content.includes(dataArray[i][0])) {
                return message.channel.send(dataArray[i][1]);
            }
        }
        return;
    }
    //cooldown
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const commandCooldownAmount = command.cooldown * 1000;
    let cooldownAmount = 3000; // default cooldown
    if (commandCooldownAmount) {
        // if there is custom cooldown
        cooldownAmount = commandCooldownAmount;
    } else if (message.channel.topic) {
        let channelTopic = message.channel.topic.toLowerCase();
        let channelWords = channelTopic.split(/ +/); //makes array of channel words
        if (channelTopic.includes('cooldown') && channelTopic.includes('=')) {
            // basic check if the channel has the "keywords"
            for (i = 0; i < channelWords.length - 2; i++) {
                // checks if command description for "cooldown" and "="
                if (
                    channelWords[i].toLowerCase() == 'cooldown' &&
                    channelWords[i + 1] == '='
                ) {
                    if (isNaN(channelWords[i + 2])) {
                        var channelCooldown = 3;
                        break;
                    }
                    var channelCooldown = channelWords[i + 2];
                    break;
                }
            }
            cooldownAmount = channelCooldown * 1000;
        }
    }
    if (
        timestamps.has(message.author.id) // this is in case someone used the command. should have put this more in front
    ) {
        const expirationTime =
            timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.channel.send(
                `please wait ${timeLeft.toFixed(
                    1
                )} more second(s) before reusing the \`${
                    command.name
                }\` command.`
            );
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    //command "user"

    try {
        // advertisments
        const ranWelcomeIndex = Math.floor(Math.random() * 50);
        if (ranWelcomeIndex === 0) {
            const serverEmbed = new Discord.MessageEmbed()
                .setTitle('Are you tired of the bot being offline?')
                .addField(
                    'join the discord server!',
                    'get notifications for new updates and bot status at [https://discord.gg/VMX5hZA](https://discord.gg/VMX5hZA)'
                )
                .setColor(blurple);
            message.channel.send(serverEmbed);
        } else if (ranWelcomeIndex === 1 || ranWelcomeIndex === 4) {
            const inviteEmbed = new Discord.MessageEmbed()
                .setTitle('Want to invite the bot to your own server?')
                .addField(
                    'Please spread the word around!',
                    'Click [here](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881) or use the link https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881'
                )
                .setColor(turq);
            message.channel.send(inviteEmbed);
        } else if (ranWelcomeIndex === 3) {
            const bugEmbed = new Discord.MessageEmbed()
                .setTitle(
                    'Want to suggest a new feature? Fix a typo? Report a bug?'
                )
                .addField(
                    'join the discord server!',
                    'suggest a new feature and report a bug at [https://discord.gg/VMX5hZA](https://discord.gg/VMX5hZA)'
                )
                .setColor(blurple);
            message.channel.send(bugEmbed);
        }
        command.execute(message, args, client); // executes the command.
    } catch (error) {
        // in case of command failures
        console.error(error);
        const errorEmbed = new Discord.MessageEmbed()
            .setColor(red)
            .setDescription('Oh no! Something went wrong!')
            .addField(
                '~~I got bonked by a DDT again~~',
                'Please [report the bug](https://discord.gg/VMX5hZA)'
            );
        return message.channel.send(errorEmbed);
    }
});
client.login(token);
//who you made it this far. Yes this is a giant mess that needs urgent fixing. trust me it used to be a lot worse.
