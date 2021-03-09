const { cyber } = require('../jsons/colours.json');
const imgur = require('imgur');
const ImgurHelper = require('../helpers/imgur');

function uploadImgur(message, args) {
    let image, text;
    try {
        [image, text] = ImgurHelper.extractImageInfo(message.attachments, args);
    } catch (e) {
        if (e instanceof ImgurHelper.ImgurAttachmentError) {
            return message.channel.send(e.message);
        } else {
            throw e;
        }
    }
    footer = `sent by ${message.author.tag}`;

    imgur
        .uploadUrl(image)
        .then((json) => {
            console.log(JSON.stringify(json, null, 1));

            const Embed = new Discord.MessageEmbed()
                .setTimestamp()
                .setDescription(`${json.link}\n${text}`)
                .setFooter(footer)
                .setColor(cyber)
                .setImage(`${json.link}`);
            message.channel.send(Embed);
            message.delete();
        })
        .catch((e) => {
            console.log(e);
            return message.channel.send(
                e.message.message.replace(
                    'File type invalid (1)',
                    `Imgur failed to identify file type as :ok_hand: ${image}`
                )
            );
        });
}

module.exports = {
    name: 'imgur',
    rawArgs: true,
    execute(message, args) {
        uploadImgur(message, args);
    },
};
