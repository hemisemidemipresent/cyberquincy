const colour = require('../jsons/colours.json');
module.exports = {
    name: 'secret',
    aliases: ['hide', 'hidden'],
    execute(message) {
        const embed = new Discord.MessageEmbed()
            .setTitle('Secret achievements')
            .addField(
                'Big Bloons',
                'Unlocks the Big Bloons Extra. Win with Pat Fusty on 10 games'
            )
            .addField(
                'Alchermistman and Bloonacleboy',
                'Unlocks the Small Bloons Extra. Get 900k pops on Bloon Master Alchemist by r100 in a single game. No other towers matter and no gamemode matters. Challenge Editor does not work.'
            )
            .addField(
                "Josh's Constant",
                'Beat any Expert map on CHIMPS with $40,870 or more spent on 1 Spike Factory'
            )
            .addField(
                '2TC',
                'Complete a game in CHIMPS Difficulty with only 2 monkey towers'
            )
            .addField(
                'Strangely Adorable',
                'get adora lvl 20 in range of a sun temple, sac'
            )
            .addField('Bill Greates', 'send $500,000 in coop in one go')
            .addField(
                'Golden Ticket',
                '[guide](https://v.redd.it/2tso1t0gkhr41/DASH_96)'
            )
            .addField(
                'Mo Heroes, Mo Problems',
                'Complete an Odyssey without a Hero'
            )
            .setColor(colour.green);
        message.channel.send(embed);
    },
};
