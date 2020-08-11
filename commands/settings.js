const Discord = require('discord.js')
module.exports = {
    name: 'setting',
    aliases: ['set', 'settings', 'options', 'o'],

    async execute (message, args) {
        user = message.author

        const tag = await Tags.findOne({
            where: {
                name: user.id
            }
        })
        const embed = new Discord.MessageEmbed()
            .setTitle(`Settings for ${user.username}#${user.discriminator}`)
            .addField('Advertisments', tag.showAds)
            .addField('Level Up Messages', tag.showLevelUpMsg)
        message.channel.send(embed)
    }
}
