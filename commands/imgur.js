const { cyber } = require('../jsons/colours.json');

const imgur = require('imgur');
module.exports = {
    name: 'imgur',

    execute(message, args) {
        let image;
        let attatched = false;
        if (message.attachments.size > 0) {
            let attachement_image = message.attachments.first();
            image = attachement_image.url;
            attatched = true;
        } else {
            let url = args[0];
            if (isValidURL(url)) {
                image = url;
            } else {
                return message.channel.send('no link specified or attatched');
            }
        }
        if (!image)
            return message.channel.send(
                'Attach an image to upload to imgur, vrej'
            );

        if (!attatched) {
            args.shift();
        }
        let text = args.join(' ');
        if (text.length == 0) {
            text = ' ';
        }
        footer = `sent by ${message.author.tag}`;

        imgur
            .uploadUrl(image)
            .then((json) => {
                const Embed = new Discord.MessageEmbed()
                    .setTimestamp()
                    .setDescription(`${json.data.link}\n${text}`)
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
function isValidURL(string) {
    if (!isValidUrl(string)) {
        let isImage =
            string.endsWith('.jpg') ||
            string.endsWith('.png') ||
            string.endsWith('.jpeg') ||
            string.endsWith('.tiff') ||
            string.endsWith('.tif') ||
            string.endsWith('.bmp') ||
            string.endsWith('.jpe') ||
            string.endsWith('.jfif') ||
            string.endsWith('.dib');
        if (isImage) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}
function isValidUrl(string) {
    try {
        new URL(string);
    } catch (_) {
        return false;
    }

    return true;
}
