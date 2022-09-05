const { cyber, black } = require('../jsons/colours.json');
const imgur = require('imgur');
const ImgurHelper = require('../helpers/imgur');

const WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);
const RED_X = '❌';

const PREVIEW_REACTIONS = [WHITE_HEAVY_CHECK_MARK, RED_X];

const BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL = '702089126706544661';
const BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL_2 = '924830831585939456';

// Fill this in when you want to test this in your own server
// Change this to a channel in your test guild when testing
const TEST_SUBMISSIONS_CHANNEL = '897024571801239573'; //'737445888602931252';
const IS_TESTING = require('../1/config.json')['testing'];
const { EmbedBuilder } = require('discord.js');
const SUBMISSIONS_CHANNEL = IS_TESTING
    ? TEST_SUBMISSIONS_CHANNEL
    : BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL;
const SUBMISSIONS_CHANNEL_2 = IS_TESTING
    ? TEST_SUBMISSIONS_CHANNEL
    : BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL_2;
async function submit(message, args) {
    // Determines whether to follow up a submission preview with reaction collection and submission to another channel
    const liveMode = message.channel.guild.id == Guilds.BTD6_INDEX || IS_TESTING;

    // If image is attached or linked, extract info to combine as imgur
    let imgurJson = null;
    let imgurText = null;
    try {
        let [image, text] = ImgurHelper.extractImageInfo(message.attachments, args);
        imgurJson = await imgur.uploadUrl(image);
        imgurText = text;
    } catch (e) {
        // Continue past failure to extract image; try link/challenge code next
        if (!(e instanceof ImgurHelper.ImgurAttachmentError)) {
            throw e;
        }
    }
    pretextMessage = liveMode
        ? 'Do you wish to submit?'
        : 'Submission Preview (you may only submit from within the BTD6 Index Channel)';

    const pretext = await message.channel.send(pretextMessage);
    let preview = undefined;
    let submission = undefined;
    if (imgurJson) {
        submission = new Discord.EmbedBuilder()
            .setTimestamp()
            .setDescription(`${imgurJson.link}\n${imgurText}`)
            .setFooter({ text: `sent by ${message.author.tag}` })
            //.setColor(cyber)
            .setImage(`${imgurJson.link}`);
        preview = await message.channel.send({ embeds: [submission] });
    } else {
        submission = args.join(' ') + `\n——————————————————————\n_Sent by ${message.author.tag}_`;
        preview = await message.channel.send(submission);
    }

    // If the current user is NOT in the BTD6 Index server (and dev is not testing)
    if (!liveMode) return;

    PREVIEW_REACTIONS.forEach((previewReaction) => {
        preview.react(previewReaction);
    });
    const filter = (reaction, user) =>
        user.id == message.author.id && PREVIEW_REACTIONS.includes(reaction.emoji.name);
    let collector = preview.createReactionCollector({ filter, time: 20000 });

    collector.once('collect', (reaction) => {
        pretext.delete();
        preview.delete();

        // Submit to BTD6 Index channel if checkmark is reacted
        // (or to the test channel if dev is testing)
        if (reaction.emoji.name == WHITE_HEAVY_CHECK_MARK) {
            (async () => {
                const SUBMISSIONS_CHANNEL_OBJ = await message.channel.guild.channels.cache.get(
                    SUBMISSIONS_CHANNEL
                );
                const SUBMISSIONS_CHANNEL_OBJ_2 = await message.channel.guild.channels.cache.get(
                    SUBMISSIONS_CHANNEL_2
                );
                let submissionMessage = undefined;
                if (submission instanceof EmbedBuilder) {
                    await SUBMISSIONS_CHANNEL_OBJ.send({
                        embeds: [submission]
                    });
                    submissionMessage = await SUBMISSIONS_CHANNEL_OBJ_2.send({
                        embeds: [submission]
                    });
                    await submissionMessage.crosspost();
                } else {
                    await SUBMISSIONS_CHANNEL_OBJ.send(submission);
                    submissionMessage = await SUBMISSIONS_CHANNEL_OBJ_2.send(submission);
                }
                let random = Math.floor(Math.random() * 1000);
                let guild = client.guilds.cache.get('614111055890612225');
                if (random == 0) {
                    let shol2 = guild.emojis.cache.get('911077729582071879');
                    await submissionMessage.react(shol2);
                } else if (random % 500 == 0) {
                    let shol = guild.emojis.cache.get('911077559071043585');
                    await submissionMessage.react(shol);
                } else if (random % 200 == 0) {
                    await submissionMessage.react('🌌');
                } else if (random % 100 == 0) {
                    await submissionMessage.react('🍼');
                } else if (random % 50 == 0) {
                    let gmilk2 = guild.emojis.cache.get('900218748613562418');
                    await submissionMessage.react(gmilk2);
                } else if (random % 20 == 0) {
                    let goldmilk = guild.emojis.cache.get('821676576525647882');
                    await submissionMessage.react(goldmilk);
                } else if (random % 10 == 0) {
                    let milk2 = guild.emojis.cache.get('897767316496990238');
                    await submissionMessage.react(milk2);
                } else if (random % 5 == 0) {
                    await submissionMessage.react('🥛');
                }

                const submittedLink = `https://discord.com/channels/${message.channel.guild.id}/${SUBMISSIONS_CHANNEL}/${submissionMessage.id}`;
                message.channel.send(`Submitted: ${submittedLink}`);
            })();
        }
    });
}

function helpMessage() {
    return new Discord.EmbedBuilder()
        .setTitle('`q!index-submit` help')
        .setDescription('**Generate a submission in `#submissions`**')
        .addFields([
            {
                name: '`q!isub <image_link/attachment> <text>`',
                value: 'Uploads to imgur and submit with <text>'
            },
            { name: '`q!isub <link> <text>`', value: 'Submits a link with text' },
            {
                name: '`q!isub <CHALLENGE_CODE> <text>`',
                value: 'Submits a challenge code with text'
            },
            {
                name: 'Note:',
                value: 'If you are _linking_ an image (rather than attaching it), you must make it the first argument to the command in order to imgur-ize it.'
            }
        ]);
    //.setColor(black);
}

module.exports = {
    name: 'index-submit',
    rawArgs: true,
    casedArgs: true,
    aliases: ['isubmit', 'isub'],
    async execute(message, args) {
        if (message.attachments.size < 1 && (!args[0] || args[0] == 'help')) {
            return await message.channel.send(helpMessage());
        }
        await submit(message, args);
    }
};
