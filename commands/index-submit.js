const colours = require('../jsons/colours.json');
const imgur = require('imgur');
const ImgurHelper = require('../helpers/imgur');

const WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);
const RED_X = '❌';

const PREVIEW_REACTIONS = [WHITE_HEAVY_CHECK_MARK, RED_X];

const BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL = '702089126706544661';
// Fill this in when you want to test this in your own server
// Change this to a channel in your test guild when testing
const TEST_SUBMISSIONS_CHANNEL = '737445888602931252';
const IS_TESTING = require('../1/config.json')['testing'];
const SUBMISSIONS_CHANNEL = IS_TESTING
    ? TEST_SUBMISSIONS_CHANNEL
    : BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL;

async function submit(message, args) {
    // Determines whether to follow up a submission preview with reaction collection and submission to another channel
    const liveMode =
        message.channel.guild.id == Guilds.BTD6_INDEX || IS_TESTING;

    // If image is attached or linked, extract info to combine as imgur
    let imgurJson = null;
    let imgurText = null;
    try {
        let [image, text] = ImgurHelper.extractImageInfo(
            message.attachments,
            args
        );
        imgurJson = await imgur.uploadUrl(image);
        imgurText = text;
    } catch (e) {
        // Continue past failure to extract image; try link/challenge code next
        if (!(e instanceof ImgurHelper.ImgurAttachmentError)) {
            throw e;
        }
    }

    let submission = null;
    if (imgurJson) {
        submission = new Discord.MessageEmbed()
            .setTimestamp()
            .setDescription(`${imgurJson.link}\n${imgurText}`)
            .setFooter(`sent by ${message.author.tag}`)
            .setColor(colours['cyber'])
            .setImage(`${imgurJson.link}`);
    } else {
        submission =
            args.join(' ') +
            `\n——————————————————————\n_Sent by ${message.author.tag}_`;
    }

    pretextMessage = liveMode
        ? 'Do you wish to submit?'
        : 'Submission Preview (you may only submit from within the BTD6 Index Channel)';

    const pretext = await message.channel.send(pretextMessage);
    const preview = await message.channel.send(submission);

    // If the current user is NOT in the BTD6 Index server (and dev is not testing)
    if (!liveMode) return;

    PREVIEW_REACTIONS.forEach((previewReaction) => {
        preview.react(previewReaction);
    });

    let collector = preview.createReactionCollector(
        (reaction, user) =>
            user.id == message.author.id &&
            PREVIEW_REACTIONS.includes(reaction.emoji.name),
        { time: 20000 }
    );

    collector.once('collect', (reaction) => {
        pretext.delete();
        preview.delete();

        // Submit to BTD6 Index channel if checkmark is reacted
        // (or to the test channel if dev is testing)
        if (reaction.emoji.name == WHITE_HEAVY_CHECK_MARK) {
            (async () => {
                const SUBMISSIONS_CHANNEL_OBJ = message.channel.guild.channels.cache.get(
                    SUBMISSIONS_CHANNEL
                );
                const submissionMessage = await SUBMISSIONS_CHANNEL_OBJ.send(submission)
                
                let random = Math.floor(Math.random() * 250);
                if (random % 10 == 0) {
                    submissionMessage.react('🥛');
                } else if (random == 0) {
                    let goldmilk = client.guilds.cache
                        .get(614111055890612225)
                        .emojis.cache.get(821676576525647882);
                    submissionMessage.react(goldmilk);
                }

                const submittedLink = `https://discord.com/channels/${message.channel.guild.id}/${SUBMISSIONS_CHANNEL}/${submissionMessage.id}`;
                message.channel.send(`Submitted: ${submittedLink}`);
            })();
        }
    });
}

function helpMessage() {
    return new Discord.MessageEmbed()
        .setTitle('`q!index-submit` help')
        .setDescription('**Generate a submission in `#submissions`**')
        .addField(
            '`q!isub <image_link/attachment> <text>`',
            'Uploads to imgur and submit with <text>'
        )
        .addField('`q!isub <link> <text>`', 'Submits a link with text')
        .addField(
            '`q!isub <CHALLENGE_CODE> <text>`',
            'Submits a challenge code with text'
        )
        .addField(
            'Note:',
            'If you are _linking_ an image (rather than attaching it), you must make it the first argument to the command in order to imgur-ize it.'
        )
        .setColor(colours['black']);
}

module.exports = {
    name: 'index-submit',
    rawArgs: true,
    casedArgs: true,
    aliases: ['isubmit', 'isub'],
    execute(message, args) {
        if (message.attachments.size < 1 && (!args[0] || args[0] == 'help')) {
            return message.channel.send(helpMessage());
        }
        submit(message, args);
    },
};
