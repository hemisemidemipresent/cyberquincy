const CYBER_SUPPORT = '598768024761139240';
const BTD6_INDEX = '661812833771847700';
const RACE_SERVER = '543957081183617024';
const EMOJIS_SERVER = "614111055890612225";

const xp = require('../helpers/xp');
const { discord } = require('../aliases/misc.json');

function enterGuild(guild) {
    let channeltosend = guild.channels.cache.find(
        (channel) => channel.name.includes('general') === true
    );
    if (channeltosend) {
        let helpEmbed = new Discord.MessageEmbed()
            .setColor(colours['cyber'])
            .setDescription(`Hi! I am Cyber Quincy. I am a btd6 discord bot.`)
            .addField(
                'General Info',
                `[List of commands](https://cq.netlify.com)\n[Discord server](${discord})`
            )
            .addField(
                'Note',
                "Quincy son of Quincy is property of Ninja Kiwi. Although they didn't develop this bot, Ninja Kiwi approved of its use and development."
            )
            .addField(
                'You should know...',
                `The most popular commands by far are those that describe towers, for example \`q!boomer 005\` (format: \`q!<towername> <path>\`)`
            )
            .setFooter(`Use \`${prefix}info\` for more information`);

        channeltosend.send(helpEmbed);
    }
}

async function addMember(member) {
    if (member.guild.id == CYBER_SUPPORT) {
        let tag = await Tags.findOne({
            where: {
                name: member.id,
            },
        });
        // Create db user if it doesn't already exist
        if (!tag) {
            tag = await Tags.create({
                name: member.id,
                xp: 0,
                showAds: true,
                showLevelUpMsg: true,
                quiz: 0,
            });
        }
        let level = xp.xpToLevel(tag.xp);
        if (level > 3) {
            await member.roles.add('645126928340353036');
        }
        if (level > 10) {
            await member.roles.add('645629187322806272');
        }
    } else if (member.guild.id == BTD6_INDEX) {
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
    } else if (member.guild.id == RACE_SERVER) {
        const general = member.guild.channels.cache.find((channel) =>
            channel.name.includes('general')
        );
        general.send(
            `welcome to the only rAcE sErVer. \nIf you cant get a top 50, you have to read <#667495608155635765> 100 times before entering`
        );
    }
}

async function removeMember(member) {
    if (member.guild.id == BTD6_INDEX) {
        let welcome = member.guild.channels.cache.find((channel) =>
            channel.name.includes('welcome')
        );
        welcome.send(`**${member.displayName}** got nerfed. hard.`);
    } else if (member.guild.id == RACE_SERVER) {
        const general = member.guild.channels.cache.find((channel) =>
            channel.name.includes('general')
        );
        general.send(
            `**${member.displayName}** couldn't resist it and accidentally revealed that he/she is hacking races`
        );
    }
}

module.exports = {
    enterGuild,
    addMember,
    removeMember,

    CYBER_SUPPORT,
    BTD6_INDEX,
    RACE_SERVER,
    EMOJIS_SERVER,
};
