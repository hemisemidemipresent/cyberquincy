const { discord } = require('../aliases/misc.json');

module.exports = {
    name: 'hentai',
    aliases: ['nsfw'],
    execute(message, args) {
        channel = message.channel;
        if (!channel.nsfw) {
            return message.channel.send('This can only be used in an nsfw channel');
        } else {
            let links = [
                'https://www.youtube.com/watch?v=OifMU4B6uik',
                'https://www.youtube.com/watch?v=erb4n8PW2qw',
                discord,
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'https://discordbotlist.com/bots/cyber-quincy',
                'https://top.gg/bot/482571244823117840'
            ];
            int = Math.floor(Math.random() * links.length);
            let embed = new Discord.EmbedBuilder().setTitle('Here you go').setURL(links[int]);
            return message.channel.send({ embeds: [embed] });
        }
    }
};
