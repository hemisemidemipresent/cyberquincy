const fetch = require('node-fetch');
const hastebin = require('hastebin-gen');

const { MessageAttachment, MessageEmbed } = require('discord.js');

module.exports = {
    name: 'json',
    async execute(message) {
        let content;

        if (message.attachments) {
            let link = message.attachments.first().url;

            content = await fetch(link);
            content = await content.text();
        } else content = message.content.slice(6).replace(/```/g, '');

        if (!verify(content)) return await message.channel.send('Invalid JSON');
        let obj = peel(content);
        let res = JSON.stringify(obj, null, 4);
        if (res.length > 4000) {
            let file = new MessageAttachment(Buffer.from(res), 'thing.json');
            let url;
            try {
                url = await hastebin(res, { extension: 'json' });
            } catch {
                url = '\u200b';
            }
            return await message.channel.send({
                content: url,
                files: [file],
            });
        } else {
            let embed = new MessageEmbed().setDescription(
                `\`\`\`json\n${res}\`\`\``
            );
            return await message.channel.send({ embeds: [embed] });
        }
    },
};
function verify(obj) {
    try {
        let o = JSON.parse(obj);
        if (o && typeof o === 'object') {
            return true;
        }
    } catch {}
    return false;
}
function peel(obj) {
    if (typeof obj == 'string') {
        try {
            obj = JSON.parse(obj);
        } catch {
            return obj;
        }
    }

    for (l in obj) {
        let actualThing = obj[l];
        if (typeof actualThing == 'string') obj[l] = peel(obj[l]);
    }
    return obj;
}
