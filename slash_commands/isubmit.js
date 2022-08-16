const { SlashCommandBuilder } = require('discord.js');

const { cyber } = require('../jsons/colours.json');
//const { discord } = require('../aliases/misc.json');
const imgur = require('imgur');

const BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL = '702089126706544661';
const BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL_2 = '924830831585939456';
const BTD6_INDEX_SERVER_ID = '661812833771847700';

// Fill this in when you want to test this in your own server
// Change this to a channel in your test guild when testing
const TEST_SUBMISSIONS_CHANNEL = '69';
const TEST_GUILD = '420';
const IS_TESTING = require('../1/config.json')['testing'];
const SUBMISSIONS_CHANNEL = IS_TESTING ? TEST_SUBMISSIONS_CHANNEL : BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL;
const SUBMISSIONS_CHANNEL_2 = IS_TESTING ? TEST_SUBMISSIONS_CHANNEL : BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL_2;
const SUBMISSIONS_GUILD = IS_TESTING ? TEST_GUILD : BTD6_INDEX_SERVER_ID;

builder = new SlashCommandBuilder()
    .setName('isubmit')
    .setDescription('Submit an image to the BTD6 Index')
    .addAttachmentOption((option) =>
        option.setName('img').setDescription('the image that you want to upload').setRequired(true)
    );

async function execute(interaction) {
    let messageAttachment = interaction.options.getAttachment('img');
    image = messageAttachment.url;
    let currentGuild = interaction.guild.id;
    if (currentGuild != SUBMISSIONS_GUILD){
        let wrongGuildErr = 'Submission Preview (you may only submit from within the BTD6 Index Channel)';
        imgur
            .uploadUrl(image)
            .then(async (json) => {
                const embed = new Discord.EmbedBuilder().setDescription(`${json.link}`).setColor(cyber).setImage(`${json.link}`);
                await interaction.reply({content: wrongGuildErr, embeds: [embed], ephemeral: true});
            })
            .catch(async (e) => {
                console.log(e);
                let errMsg = e.message.message.replace(
                    'File type invalid (1)',
                    `Imgur failed to identify file type as :ok_hand: ${image}`
                );
                return await interaction.reply({ content: errMsg, ephemeral: false });
            });
        return;
    }
    console.log(interaction.guild.id);
    imgur
        .uploadUrl(image)
        .then(async (json) => {
            const embed = new Discord.EmbedBuilder().setDescription(`${json.link}`).setColor(cyber).setImage(`${json.link}`).setFooter({text: `sent by ${interaction.user.tag}` });
            const {url} = await interaction.guild.channels.resolve(SUBMISSIONS_CHANNEL).send({embeds: [embed]});
            await interaction.guild.channels.resolve(SUBMISSIONS_CHANNEL_2).send({embeds: [embed]});
            await interaction.reply({ content: 'Submitted: ' + url });
        })
        .catch(async (e) => {
            console.log(e);
            let errMsg = e.message.message.replace(
                'File type invalid (1)',
                `Imgur failed to identify file type as :ok_hand: ${image}`
            );
            return await interaction.reply({ content: errMsg, ephemeral: false });
        });
    
}

module.exports = {
    data: builder,
    execute
};
