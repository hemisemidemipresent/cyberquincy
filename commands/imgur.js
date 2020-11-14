const { cyber } = require('../jsons/colours.json');

const imgur = require('imgur');
module.exports = {
    name: 'imgur',

    execute(message, args) {
        let image;
        if (message.attachments.size > 0) {
            let attachement_image = message.attachments.first();
            image = attachement_image.url;
        }
        if (!image) {
            return message.channel.send(
                'Attach an image to upload to imgur, vrej'
            );
        }
        let footer;
        if (args[0]) {
            footer = `invoked by ${message.author.tag}, by ${args.join(' ')}`;
        } else {
            footer = `by ${message.author.tag}`;
        }
        imgur
            .uploadUrl(image)
            .then((json) => {
                const Embed = new Discord.MessageEmbed()
                    .setTimestamp()
                    .setDescription(`${json.data.link}`)
                    .setFooter(footer)
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
