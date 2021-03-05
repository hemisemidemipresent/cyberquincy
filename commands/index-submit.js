const colours = require('../jsons/colours.json');
const imgur = require('imgur');
const ImgurHelper = require('../helpers/imgur');

const WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);
const RED_X = '❌';

const PREVIEW_REACTIONS = [WHITE_HEAVY_CHECK_MARK, RED_X]

const BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL = '702089126706544661';
// Fill this in when you want to test this in your own server
const TEST_SUBMISSIONS_CHANNEL = null;

async function submit(message, args) {
    const liveMode = message.channel.guild.id == Guilds.BTD6_INDEX || TEST_SUBMISSIONS_CHANNEL != null
    let imgurJson = null;
    let imgurText = null;
    try {
        let [image, text] = ImgurHelper.extractImageInfo(message.attachments, args);
        imgurJson = await imgur.uploadUrl(image);
        imgurText = text;
    } catch(e) {
        if (!(e instanceof ImgurHelper.ImgurAttachmentError)) {
            throw e;
        }
    }

    submission = null;
    if (imgurJson) {
        submission = new Discord.MessageEmbed()
                            .setTimestamp()
                            .setDescription(`${imgurJson.data.link}\n${imgurText}`)
                            .setFooter( `sent by ${message.author.tag}`)
                            .setColor(colours['cyber'])
                            .setImage(`${imgurJson.data.link}`);
    } else {
        submission = args.join(' ') + `\n——————————————————————————————\n_Sent by ${message.author}_`
    }

    pretextMessage = "Submission Preview";
    pretextMessage += liveMode ? '' : " (you may only submit from within the BTD6 Index Channel)";
    pretextMessage += ":";

    pretext = await message.channel.send(pretextMessage);
    preview = await message.channel.send(submission);

    // If the current user is NOT in the BTD6 Index server
    if (!liveMode) return;

    PREVIEW_REACTIONS.forEach(previewReaction => {
        preview.react(previewReaction)
    })

    let collector = preview.createReactionCollector(
        (reaction, user) =>
            user.id == message.author.id && PREVIEW_REACTIONS.includes(reaction.emoji.name), 
        { time: 20000 }
    )

    collector.once('collect', (reaction) => {
        pretext.delete();
        preview.delete();

        if (reaction.emoji.name == WHITE_HEAVY_CHECK_MARK) {
            (async () => {
                const SUBMISSIONS_CHANNEL = message.channel.guild.channels.cache.get(
                    TEST_SUBMISSIONS_CHANNEL || BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL
                );
                submissionMessage = await SUBMISSIONS_CHANNEL.send(submission);
                message.channel.send(`Submitted: https://discord.com/channels/${Guilds.BTD6_INDEX}/${BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL}/${submissionMessage.id}`)
            })();
        }
    })
}

function helpMessage() {
    return new Discord.MessageEmbed()
                .setTitle('`q!index-submit` help')
                .setDescription('**Generate a submission in `#submissions`**')
                .addField('`q!isub <image_link/attachment> <text>`', 'Uploads to imgur and submit with <text>')
                .addField('`q!isub <link> <text>`', 'Submits a link with text')
                .addField('`q!isub <CHALLENGE_CODE> <text>`', 'Submits a challenge code wiht text')
                .setColor(colours['black']);
}

module.exports = {
    name: 'index-submit',
    rawArgs: true,
    aliases: ['isubmit', 'isub'],
    execute(message, args) {
        if (message.attachments.length < 1 && !args[0] || args[0] == 'help') {
            return message.channel.send(helpMessage())
        }
        submit(message, args);
    },
};
