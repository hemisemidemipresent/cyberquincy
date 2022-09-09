const RegexParser = require('../parser/regex-parser');

const colours = require('../jsons/colors.json');

const BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL = '702089126706544661';
// Fill this in when you want to test this in your own server
// Change this to a channel in your test guild when testing
const TEST_SUBMISSIONS_CHANNEL = '737445888602931252';
const IS_TESTING = require('../1/config.json')['testing'];
const SUBMISSIONS_CHANNEL = IS_TESTING ? TEST_SUBMISSIONS_CHANNEL : BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL;

const REAL_CYBER_QUINCY_USER_ID = '591922988832653313';
const TEST_CYBER_QUINCY_USER_ID = '737094027400183868';
const CYBER_QUINCY_USER_ID = IS_TESTING ? TEST_CYBER_QUINCY_USER_ID : REAL_CYBER_QUINCY_USER_ID;
const HELPER_ROLE_ID = '923076988607037470';

DISCORD_LINK_REGEX = /https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)/i;

async function unsubmit(message, url) {
    const liveMode = message.channel.guild.id == Guilds.BTD6_INDEX || IS_TESTING;

    let [, server_id, channel_id, message_id] = url.match(DISCORD_LINK_REGEX);

    if (!liveMode) {
        return message.channel.send('Must be in BTD6 Index Channel to run this command');
    }

    if (!IS_TESTING && server_id != Guilds.BTD6_INDEX) {
        return message.channel.send('Can only unsubmit from BTD6 Index Channel');
    }

    if (channel_id != SUBMISSIONS_CHANNEL) {
        return message.channel.send('Can only unsubmit messages in **#submissions**');
    }

    const SUBMISSIONS_CHANNEL_OBJ = message.channel.guild.channels.cache.get(SUBMISSIONS_CHANNEL);
    messages = await SUBMISSIONS_CHANNEL_OBJ.messages.fetch({ limit: 100 });

    if ((submission = messages.get(message_id))) {
        if (submission.author.id != CYBER_QUINCY_USER_ID) {
            return message.channel.send(
                `That isn't a \`q!index-submit\` submission. ${submission.author.username} wrote that.`
            );
        }
        let submitterTag;
        if (submission.content == '') {
            // It's an imgur embedded submission
            submitterTag = submission.embeds[0].footer.text.match(/sent by (.*)/)[1];
        } else {
            // Inline
            submitterTag = submission.content.match(/Sent by (.*?)_$/)[1];
        }
        if (submitterTag == message.author.tag || message.member.roles.cache.has(HELPER_ROLE_ID)) {
            try {
                submission.delete();
                return message.channel.send('Your submission was successfully removed.');
            } catch {
                return message.channel.send('Failed to remove submission');
            }
        } else {
            return message.channel.send(
                `You, ${message.author.tag}, didn't submit this. ${submitterTag} did. You must be the submitter to delete.`
            );
        }
    } else {
        return message.channel.send('Message was already deleted');
    }
}

function helpMessage() {
    return new Discord.EmbedBuilder()
        .setTitle('`q!index-unsubmit` help')
        .setDescription('**Remove one of your submissions from `#submissions`**')
        .addFields([
            { name: '`q!isub <link_to_submission_message>`', value: 'Removes your submission if it is still there' }
        ])
        .setColor(colours['black']);
}

module.exports = {
    name: 'index-unsubmit',
    aliases: ['iunsubmit', 'iuns'],
    execute(message, args) {
        if (!args[0] || args[0] == 'help') {
            return message.channel.send(helpMessage());
        }

        const parsed = CommandParser.parse(args, new RegexParser(DISCORD_LINK_REGEX));
        if (parsed.hasErrors()) {
            return message.channel.send(
                parsed.parsingErrors
                    .map((pe) => {
                        msg = pe.message;
                        if (msg.includes('does not match')) {
                            msg = `Link must be of form \`https://discord.com/channels/<server_id>/<channel_id>/<message_id>\``;
                        }
                        return `• ${msg}`;
                    })
                    .join('\n')
            );
        }

        unsubmit(message, parsed.regex);
    }
};
