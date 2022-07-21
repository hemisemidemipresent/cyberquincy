const { SlashCommandBuilder } = require('@discordjs/builders');

const { cyber } = require('../jsons/colours.json');
//const { discord } = require('../aliases/misc.json');
const imgur = require('imgur');

builder = new SlashCommandBuilder()
    .setName('imgur')
    .setDescription('Upload an image to imgur')
    .addAttachmentOption((option) =>
        option.setName('img').setDescription('the image that you want to upload').setRequired(true)
    );

async function execute(interaction) {
    let messageAttachment = interaction.options.getAttachment('img');
    image = messageAttachment.url;

    imgur
        .uploadUrl(image)
        .then(async (json) => {
            const embed = new Discord.EmbedBuilder().setDescription(`${json.link}`).setColor(cyber).setImage(`${json.link}`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        })
        .catch(async (e) => {
            console.log(e);
            let errMsg = e.message.message.replace(
                'File type invalid (1)',
                `Imgur failed to identify file type as :ok_hand: ${image}`
            );
            return await interaction.reply({ content: errMsg, ephemeral: true });
        });
}

module.exports = {
    data: builder,
    execute
};
