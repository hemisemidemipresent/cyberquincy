const { SlashCommandBuilder } = require('discord.js');

const { cyber } = require('../jsons/colors.json');
//const { discord } = require('../aliases/misc.json');
const imgur = require('imgur');

const BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL = '702089126706544661';
const BTD6_INDEX_SERVER_ID = '661812833771847700';

// Fill this in when you want to test this in your own server
// Change this to a channel in your test guild when testing
const TEST_SUBMISSIONS_CHANNEL = '420';
const TEST_GUILD = '69';
const IS_TESTING = require('../1/config.json').testing;
const SUBMISSIONS_CHANNEL = IS_TESTING ? TEST_SUBMISSIONS_CHANNEL : BTD6_INDEX_SERVER_SUBMISSIONS_CHANNEL;
const SUBMISSIONS_GUILD = IS_TESTING ? TEST_GUILD : BTD6_INDEX_SERVER_ID;

const REAL_CYBER_QUINCY_USER_ID = '591922988832653313';
const TEST_CYBER_QUINCY_USER_ID = '1004190933400698920';
const CYBER_QUINCY_USER_ID = IS_TESTING ? TEST_CYBER_QUINCY_USER_ID : REAL_CYBER_QUINCY_USER_ID;
const HELPER_ROLE_ID = '923076988607037470';

const DISCORD_LINK_REGEX = /https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)/i;

builder = new SlashCommandBuilder()
	.setName('iunsubmit')
	.setDescription('Remove one of your submissions from #submissions')
	.addStringOption((option) =>
		option.setName('url').setDescription('Link to the submissions message').setRequired(true)
	);


async function execute(interaction) {
    const LIVEMODE = interaction.guild.id == SUBMISSIONS_GUILD;
    let currentGuild = interaction.guild.id;
    let url = interaction.options.getString('url');
    let [, server_id, channel_id, message_id] = url.match(DISCORD_LINK_REGEX);

    if (!LIVEMODE){
        return await interaction.reply({content: `Must be in the BTD6 Index Server to run this command`});
    }

    if(!IS_TESTING && currentGuild != SUBMISSIONS_GUILD){
        return await interaction.reply({ content: 'Can only unsubmit from BTD6 Index Server', ephemeral: true });
    }

    if(channel_id != SUBMISSIONS_CHANNEL){
        return await interaction.reply({ content: 'Can only unsubmit messages in #submissions', ephemeral: true });
    }

    const SUBMISSIONS_CHANNEL_OBJ = interaction.guild.channels.cache.get(SUBMISSIONS_CHANNEL);
    messages = await SUBMISSIONS_CHANNEL_OBJ.messages.fetch({limit: 100});

    if (submission = messages.get(message_id)){
        if(submission.author.id != CYBER_QUINCY_USER_ID){
            return await interaction.reply({ content: `This isn't a /isub submission. ${submission.author.username} wrote that`, ephemeral: true });
        }
        let submitterTag;
        if (submission.content == '') {
            submitterTag = submission.embeds[0].footer.text.match(/sent by (.*)/)[1];
        } else {
            submitterTag = submission.content.match(/Sent by (.*)/)[1];
        }
        if (submitterTag == interaction.user.tag || interaction.member.roles.cache.has(HELPER_ROLE_ID)){
            try {
                submission.delete();
                return await interaction.reply({content: `The submission was successfully removed`})
            } catch {
                return await interaction.reply({content: `Failed to removes submission`})
            }
        } else {
            return await interaction.reply({content: `You ${interaction.user.tag}, didn't submit this. ${submitterTag} did. You must be the submitter to delete.`});
        }
    } else {
        return await interaction.reply({content: `Message was already deleted`});
    }
}

module.exports = {
	data: builder,
	execute
};
