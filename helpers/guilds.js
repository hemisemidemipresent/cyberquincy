

module.exports = {
    enterGuild(guild) {
        let channeltosend = guild.channels.cache.find(
            (channel) => channel.name.includes('general') === true
        );
        if (channeltosend) {
            let helpEmbed = new Discord.MessageEmbed()
                .setColor(colours['cyber'])
                .setDescription(`Hi! I am Cyber Quincy. I am a btd6 discord bot.`)
                .addField(
                    'General Info',
                    '[List of commands](https://cq.netlify.com)\n[Discord server](https://discord.gg/VMX5hZA)'
                )
                .addField(
                    'Note',
                    "Quincy son of Quincy is property of Ninja Kiwi. Although they didn't develop this bot, Ninja Kiwi approved of its use and development."
                )
                .addField(
                    "You should know...",
                    `The most popular commands by far are those that describe towers, for example \`q!boomer 005\` (format: \`q!<towername> <path>\`)`
                )
                .setFooter(`Use \`${prefix}info\` for more information`);
            
            channeltosend.send(helpEmbed);
        }
    },

    CYBER_SUPPORT: 598768024761139240,
    BTD6_INDEX: 661812833771847700,
    RACE_SERVER: 543957081183617024,

    CYBER_WELCOME: 'Welcome to **Cyber Quincy Bot Support**! Thank you for joining!\n\
    **Get yourself a role in <#605712758595649566>**\n\n\
    :tools: **Found a bug?**\n\
    Check with <#615159685477040135>, <#616603947481694209>, <#676670780204908555> or in <#598768319625035776>.\n\n\
    :beetle: **Found an UNKNOWN bug?**\n\
    Please report in <#598768319625035776>\n\n\
    :jigsaw: **Need help or want to ask something?**\n\
    Ask in<#611808489047719937> (for only the bot).\n\n\
    :mailbox_with_mail: **Have a suggestion?**\n\
    Please tell us in <#598768278550085633>. Do try to be objective and feel free to be critical\n\n\
    **Invite me to your server**:https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881\n\n\
    Thank you for joining!',

    async addMember(member) {
        if (member.guild.id === module.exports.CYBER_SUPPORT) {
            if (member.id === Users.HMMM) {
                return;
            }
            const tchannel = member.guild.channels.cache.find((channel) =>
                channel.name.includes('general')
            );
            tchannel.send(
                `Welcome to the server, **${member.displayName}**. Please check the DM for more information, and read <#605712758595649566>. Thanks for joining, and the server now has **${member.guild.memberCount}** members!`
            );
            member.send(
                module.exports.CYBER_WELCOME
            );
        } else if (member.guild.id == module.exports.BTD6_INDEX) {
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
                .setColor(colours['cyber']);
            member.send(wel);
        } else if (member.guild.id === module.exports.RACE_SERVER) {
            const general = member.guild.channels.cache.find((channel) =>
                channel.name.includes('general')
            );
            general.send(
                `welcome to the only rAcE sErVer. \nIf you cant get a top 50, you have to read <#667495608155635765> 100 times before entering`
            );
        }
    },

    async removeMember(member) {
        if (member.guild.id == module.exports.CYBER_SUPPORT) {
            const general = member.guild.channels.cache.find((channel) =>
                channel.name.includes('general')
            );
            general.send(`**${member.displayName}** was lost in battle`);
        } else if (member.guild.id === module.exports.BTD6_INDEX) {
            let welcome = member.guild.channels.cache.find((channel) =>
                channel.name.includes('welcome')
            );
            welcome.send(`**${member.displayName}** got nerfed. hard.`);
        } else if (member.guild.id === module.exports.RACE_SERVER) {
            const general = member.guild.channels.cache.find((channel) =>
                channel.name.includes('general')
            );
            general.send(
                `**${member.displayName}** couldn't resist it and accidentally revealed that he/she is hacking races`
            );
        }
    }
};