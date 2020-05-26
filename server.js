/*
DISCLAIMER: variable names are horrible here, I apologise. Try and stick to the comments as much as you can.
there are a few other pieces in the code before the message event collector. only then the code starts getting weird.
*/
const express = require('express');
const app = express();
app.use(express.static('public'));
app.get('/', (request, response) => {
    console.log(Date.now() + ' Ping Received');
    response.sendStatus(200);
});
app.listen(process.env.PORT);
const fs = require('fs');
const Discord = require('discord.js');
const Sequelize = require('sequelize');
const { prefix, colour, token } = require('./shh/config.json');
const dataArray = [
    [
        'invite',
        'https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881',
    ],
    ['server', 'https://discord.gg/VMX5hZA'],
    [
        'add',
        'https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881',
    ],
    [
        'hack',
        'https://cdn.discordapp.com/attachments/598768278550085633/713184218598998107/hackedquincy.png',
    ],
    ['what', 'idk google it yourself'],
    ['web', 'https://cq.netlify.app'][
        ('rohan', 'I am not allowed to say anything')
    ],
    ['nsfw', 'you are under 180 and hence banned from watching'],
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
let levelUpMessages = [
    'Haha!',
    'Ha!',
    'Oh Yeah!',
    'Alright!',
    'Sweet!',
    'Yes!',
    'Nice!',
    'Awesome!',
];
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});
const Tags = sequelize.define('tags', {
    name: {
        type: Sequelize.STRING,
        unique: true,
    },
    xp: Sequelize.INTEGER,
    level: Sequelize.INTEGER,
});
const cooldowns = new Discord.Collection();
client.once('ready', () => {
    Tags.sync();
    console.log('<Program Directive>');
    function too() {
        console.log('<Eradicate Bloons>');
    }
    setTimeout(too, 1000);
    function three() {
        console.log('<INITIATE>');
    }
    setTimeout(three, 2000);
    //dont mind these:
    //let servers = client.guilds.map(g=>g.name)
    //console.log(servers)

    client.user.setActivity(`${prefix}help`);
});

client.on('guildCreate', (guild) => {
    let channeltosend = guild.channels.cache.find(
        (channel) => channel.name.includes('general') === true
    );
    if (!channeltosend) {
        return console.log('wtf');
    } else {
        let helpEmbed = new Discord.MessageEmbed()
            .setColor(colour)
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
    const helpembed = new Discord.MessageEmbed()
        .setColor(colour)
        .setTitle(
            'Welcome to **Cyber Quincy Bot Support**! Thank you for joining!'
        )
        .setDescription(
            `The point of this server is so that you can report bugs, get updated on new bot updates, check the downtime, and talk to others about the bot!`
        )
        .addField(
            'if you are experiencing an error:',
            'check with <#615159685477040135>, <#616603947481694209> or <#605712758595649566>.'
        )
        .addField(
            'if you think that there is a bug:',
            'go to <#59876831965035776> and please tell us what went wrong. If you have any questions on how to use this bot, go to <#611808489047719937>. if you have a suggestion, please let us know in <#598768278550085633>'
        )
        .addField(
            'general information:',
            '[List of commands](https://cq.netlify.com), join for updates and important uptimes and downtimes'
        );
    if (member.guild.id === '598768024761139240') {
        if (member.id == '668312965664997386') {
            return;
        }
        const tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('welcome')
        );
        tchannel.send(
            `Welcome to the server, **${member.displayName}**. Please check the DM for more information, and read <#605712758595649566>. Thanks for joining, and you are our **${member.guild.memberCount}**th member!`
        );
        member.send(helpembed);
        try {
            await Tags.create({
                name: member.id,
                xp: 0,
                level: 1,
            });
        } catch (e) {
            if (e.name === 'SequelizeUniqueConstraintError') {
                let userData = await Tags.findOne({
                    where: { name: member.id },
                });
                if (userData.level > 3) {
                    member.roles.add('645126928340353036');
                    member.send(
                        'It seems that you are already level 3! the role has been given!'
                    );
                }
                if (userData.level > 10) {
                    member.roles.add('645629187322806272');
                    member.send(
                        'It seems that you are already level 10! the role has been given!'
                    );
                }
            }
        }
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
            .setColor(colour);
        member.send(wel);
    } else if (member.guild.id === '543957081183617024') {
        const tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('general')
        );
        tchannel.send(
            `welcome to the only rAcE sErVer. \nIf you cant get a top 1%, you have to read <#667495608155635765> 100 times before enetering`
        );
    }
});
client.on('guildMemberRemove', async (member) => {
    if (member.guild.id == '598768024761139240') {
        const tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('welcome')
        );
        tchannel.send(`${member.displayName} was lost in battle`);
    } else if (member.guild.id === '543957081183617024') {
        const tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('general')
        );
        tchannel.send(
            `**${member.displayName}** couldnt resist it and accidentally revealed that he/she is hacking races`
        );
    } else if (member.guild.id === '661812833771847700') {
        let tchannel = member.guild.channels.cache.find((channel) =>
            channel.name.includes('general')
        );
        tchannel.send(`**${member.displayName}** got nerfed. hard.`);
    }
});
client.on('message', async (message) => {
    if (message.author.bot) return; // checks for bots
    let c = message.content.toLowerCase(); // c for message Content
    let channelId = message.channel.id; // channel id

    if (
        (channelId == '598768185281609738' ||
            channelId == '615159685477040135') &&
        c.includes('.')
    ) {
        let channel = client.channels.cache.find(
            (channel) => channel.id == '661888246090825749'
        );
        let embed = new Discord.MessageEmbed()
            .setDescription(message.content)
            .setColor(colour)
            .addField(
                'join the discord server',
                '[message was from here](https://discord.gg/VMX5hZA)'
            );

        channel.send(embed);
    }
    if (channelId == '661888246090825749') {
        let channel = client.channels.find(
            (channel) => channel.id == '616603947481694209'
        );
        let embed = new Discord.MessageEmbed()
            .setDescription(message.content)
            .setColor(colour)
            .addField(
                'join the BTD index server',
                '[message was from here](https://discord.gg/RAGfmAB)'
            );

        channel.send(embed);
    }
    if (!c.startsWith(prefix) || noocmd.test(message.channel.topic)) return;
    const args = c.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    if (c.startsWith('q! '))
        return message.channel.send(
            'there isnt a space between q! and the command name'
        );
    if (
        commandName === 'level' ||
        commandName === 'xp' ||
        commandName === 'rank'
    ) {
        if (args[0]) {
            // for the case when the user mentions another user
            const user = getUserFromMention(args[0]); // get user from mention
            if (!user) {
                // the case when the "user" specified is invalid/there wasnt a mention
                if (args[0].includes('h')) {
                    //potential "help" needed?
                    const hembed = new Discord.MessageEmbed().setDescription(
                        'proprties of xp system:\n1.you get xp by using commands (cooldowns apply)\n2. you get a anywhere from 5 to 12 xp for each command\n3. xp is gained in dms.\n4.role rewards only for those in the discord server.\n5.this xp is universal, it is not confined to 1 server.\n6. hidden multipliers exist, you just need to find them.',
                        { code: 'md' }
                    );
                    return message.channel.send(hembed);
                }
                if (args[0].includes('rewa')) {
                    //potential "rewards" needed?
                    const lvlMebed = new Discord.MessageEmbed()
                        .setTitle(`xp rewards`)
                        .addField('level 3', `<@&645126928340353036> `)
                        .addField('level 10', `<@&645629187322806272>`)
                        .setColor(colour)
                        .addField(
                            'you only get role rewards in the bot discord server',
                            '[discord server](https://discord.gg/VMX5hZA)'
                        )
                        .setFooter(
                            `you only get role rewards in the bot discord server`
                        );
                    return message.channel.send(lvlMebed);
                }
                /*if (message.author.id == '699780654740668426') {
                    if (args[0] == 'reset') {
                        const affectedRows = await Tags.update(
                            { xp: 0, level: 1 },
                            { where: { name: message.author.id } }
                        );
                        message.channel.send('resetted your xp');
                    }
                }*/
                let userData = await Tags.findOne({ where: { name: args[0] } }); // in case they are directly using the discord id. userData represents the "found" data
                if (!userData)
                    // in case
                    return message.channel.send(
                        "Please use a proper mention if you want to see someone else's level"
                    );
                //let user = client.users.find((u) => u.id == userData.name);  old version
                ////let user = client.users.cache.find((u) => u.id == userData.name);  djs v12 old code
                let user = client.users.cache.get(`${userData.name}`); // finds user class from id
                const xpEmbed = new Discord.MessageEmbed()
                    .setTitle(`${user.username}'s xp'`)
                    .addField('level', userData.level - 1)
                    .addField('xp', userData.xp)
                    .setColor(colour)
                    .addField(
                        'have a suggestion or found a bug?',
                        'Please tell us [here](https://discord.gg/VMX5hZA)!'
                    )
                    .setFooter('use q!level rewards to see role rewards');
                return message.channel.send(xpEmbed);
            }
            try {
                // if there is a mention
                let userData = await Tags.findOne({ where: { name: user.id } });
                if (!userData) {
                    // i really dont think this is necessary but high chance user pinged is gonna try out a few commands
                    await Tags.create({
                        name: user.id,
                        xp: 0,
                        level: 1,
                    });
                }
                const xpEmbed = new Discord.MessageEmbed()
                    .setTitle(`${user.username}'s xp'`)
                    .addField('level', userData.level - 1)
                    .addField('xp', userData.xp)
                    .setColor(colour)
                    .addField(
                        'have a suggestion or found a bug?',
                        'Please tell us [here](https://discord.gg/VMX5hZA)!'
                    )
                    .setFooter('use q!level rewards to see role rewards');
                return message.channel.send(xpEmbed);
            } catch (e) {
                console.log(e);
                const errorEmbed = new Discord.MessageEmbed()
                    .setColor('#ff0000')
                    .setDescription('Oh no! Something went wrong!')
                    .addField(
                        '~~I got bonked by a DDT again~~',
                        'Please [report the bug](https://discord.gg/VMX5hZA)'
                    );
                return message.channel.send(errorEmbed);
            }
        }
        //when there isnt a mention, it shows your own level and xp
        let data = await Tags.findOne({ where: { name: message.author.id } });
        if (!data) return message.channel.send('You dont have any xp!');
        let xpEmbed = new Discord.MessageEmbed()
            .setTitle(`${message.author.username}'s xp`)
            .addField('level', data.level - 1)
            .addField('xp', data.xp)
            .setColor(colour)
            .addField(
                'have a suggestion or found a bug?',
                'Please tell us [here](https://discord.gg/VMX5hZA)!'
            )
            .setFooter('use q!level rewards to see role rewards');
        return message.channel.send(xpEmbed);
    }
    // admin command
    if (commandName === 'yeetda') {
        if (message.author.id != '699780654740668426') return;
        await Tags.update(
            { level: parseInt(args[1]) + 1, xp: args[2] },
            { where: { name: args[0] } }
        );
    }
    if (
        commandName == 'cmdc' ||
        commandName == 'cmdcount' ||
        commandName == 'commandcount' ||
        commandName == 'commandc'
    ) {
        // a rather cut-throat method of storing the total commands used
        let commandCount = await Tags.findOne({ where: { name: 1000 } });
        message.channel.send(
            `${commandCount.xp} (non-spaghetti) commands have been used since 12/2/20 10.51.38.339am UTC`
        );
    }
    if (commandName == 'deletexp') {
        try {
            let data = await Tags.destroy({
                where: { name: message.author.id },
            });
            if (!data)
                return message.channel.send(
                    'I dont have any data stored of you!'
                );
        } catch {
            return message.channel.send(
                'Something went wrong! Report it here: https://discord.gg/VMX5hZA'
            );
        }
        return message.channel.send('Your data should now be deleted');
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
        command.execute(message, args, client); // executes the command.

        let numberOfCommands = await Tags.findOne({
            // the command count thingy, every time someone runs a command the "data" with id of 1000 gets +1
            where: { name: 1000 },
        });
        await Tags.update(
            { xp: numberOfCommands.xp + 1 },
            { where: { name: 1000 } }
        );
        let xpAdd = 0;
        if (message.channel.type == 'dm') {
            // less xp when DMing.
            xpAdd = Math.floor(Math.random() * 4) + 2;
        } else {
            xpAdd = Math.floor(Math.random() * 8) + 5;
        }
        try {
            // this checks for level up. this is super spaghetti-ish
            //main thing here is first try and make a new entry, but uses errors to see if there is already one present. not elegant but it works.
            await Tags.create({
                // attempts to make a new entry, for new people
                name: message.author.id,
                xp: 0,
                level: 1,
            });
        } catch (e) {
            // when an "error" occurs that there is already an entry with the user id
            if (e.name === 'SequelizeUniqueConstraintError') {
                const beforeUpdateUserData = await Tags.findOne({
                    where: { name: message.author.id },
                });
                const affectedRows = await Tags.update(
                    { xp: beforeUpdateUserData.xp + xpAdd },
                    { where: { name: message.author.id } }
                );
                if (affectedRows > 0) {
                    // when the xp updates
                    const tag1 = await Tags.findOne({
                        where: { name: message.author.id },
                    });
                    if (tag1.level > 20) {
                        // xp is different past level 20
                        if (
                            tag1.xp >
                            5 * ((tag1.level + 20) * (tag1.level + 20)) +
                                50 * (tag1.level + 20) +
                                100
                        ) {
                            await Tags.update(
                                { level: tag1.level + 1 },
                                { where: { name: message.author.id } }
                            );
                            let ran = Math.floor(Math.random() * 8);

                            let ltxt = levelUpMessages[ran];

                            let levelUpEmbed = new Discord.MessageEmbed()
                                .setTitle(ltxt)
                                .setDescription(
                                    `You levelled up to level ${tag1.level}!\nxp : ${tag1.xp}\nuse q!level to see your level and xp`
                                )
                                .setFooter(
                                    'add us to your server: https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881'
                                )
                                .setColor('#00ff00');
                            message.channel.send(levelUpEmbed);
                            let guildmember = client.guilds.get(
                                '598768024761139240'
                            );

                            guildmember.members
                                .array()
                                .find((m) => m.id === message.author.id);
                            if (tag1.level === 3) {
                                // if member is level 3 add role
                                await guildmember.roles.add(
                                    '645126928340353036'
                                );
                            }
                            if (tag1.level === 10) {
                                // if member is level 10 add role
                                await guildmember.roles.add(
                                    '645629187322806272'
                                );
                            }
                        }
                    } else if (tag1.xp > tag1.level * 100) {
                        await Tags.update(
                            { level: tag1.level + 1 },
                            { where: { name: message.author.id } }
                        );
                        let ran = Math.floor(Math.random() * 8);
                        let ltxt = levelUpMessages[ran];
                        let levelUpEmbed = new Discord.MessageEmbed()
                            .setTitle(ltxt)
                            .setDescription(
                                `You levelled up to level ${tag1.level}!\nxp : ${tag1.xp}\nuse q!level to see your level and xp`
                            )
                            .setFooter(
                                'add us to your server: https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881'
                            )
                            .setColor('#00ff00');
                        message.channel.send(levelUpEmbed);
                        let guildmember = client.guilds.cache
                            .get('598768024761139240')
                            .members.cache.array()

                            .find((m) => m.id === message.author.id);
                        if (tag1.level === 3) {
                            // if member is level 3 add role
                            await guildmember.roles.add('645126928340353036');
                        }
                        if (tag1.level === 10) {
                            // if member is level 10 add role
                            await guildmember.roles.add('645629187322806272');
                        }
                    }

                    return;
                }
            }
            let errorEmbed = new Discord.MessageEmbed() // in case of db failures
                .setColor('#ff0000')
                .setDescription('Oh no! Something went wrong!')
                .addField(
                    '~~I got bonked by a DDT again~~',
                    'Please [report the bug](https://discord.gg/VMX5hZA)'
                );
            return message.channel.send(errorEmbed);
        }
    } catch (error) {
        // in case of command failures
        console.error(error);
        const errorEmbed = new Discord.MessageEmbed()
            .setColor('#ff0000')
            .setDescription('Oh no! Something went wrong!')
            .addField(
                '~~I got bonked by a DDT again~~',
                'Please [report the bug](https://discord.gg/VMX5hZA)'
            );
        return message.channel.send(errorEmbed);
    }
    const ranWelcomeIndex = Math.floor(Math.random() * 50);
    if (ranWelcomeIndex === 0) {
        const serverEmbed = new Discord.MessageEmbed()
            .setTitle('Are you tired of the bot being offline?')
            .addField(
                'join the discord server!',
                'get notifications for new updates and bot status at [https://discord.gg/VMX5hZA](https://discord.gg/VMX5hZA)'
            )
            .setColor('#7289da');
        return message.channel.send(serverEmbed);
    } else if (ranWelcomeIndex === 1) {
        const inviteEmbed = new Discord.MessageEmbed()
            .setTitle('Want to invite the bot to your own server?')
            .addField(
                'Please spread the word around!',
                'Click [here](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881) or use the link https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881'
            )
            .setColor('#00ff69');
        return message.channel.send(inviteEmbed);
    } else if (ranWelcomeIndex === 3) {
        const bugEmbed = new Discord.MessageEmbed()
            .setTitle(
                'Want to suggest a new feature? Fix a typo? Report a bug?'
            )
            .addField(
                'join the discord server!',
                'suggest a new feature and report a bug at [https://discord.gg/VMX5hZA](https://discord.gg/VMX5hZA)'
            )
            .setColor('#7289da');
        return message.channel.send(bugEmbed);
    }
});
client.login(token);
//who you made it this far. Yes this is a giant mess that needs urgent fixing. trust me it used to be a lot worse.
