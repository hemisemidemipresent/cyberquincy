const { cyber } = require('../jsons/colours.json');

const imgur = require('imgur');
module.exports = {
    name: 'imgur',

    execute(message, args) {
        let image;
        if (message.attachments.size > 0) {
            let attachement_image = message.attachments.first();
            image = attachement_image.url;
        } else {
            image = args[1];
        }
        if (!image)
            return message.channel.send(
                'Attach an image to upload to imgur, vrej'
            );
        imgur
            .uploadUrl(image)
            .then((json) => {
                const Embed = new Discord.MessageEmbed()
                    .setTimestamp()
                    .setDescription(`${json.data.link}`)
                    .setFooter(`by ${message.author.tag}`)
                    .setColor(cyber)
                    .setImage(`${json.data.link}`);
                message.channel.send(Embed);
                message.delete();
            })
            .catch((err) => {
                console.log(err);
                return message.channel.send('vrej');
            });
    },
};
