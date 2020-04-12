const Discord = require('discord.js');
const { colour } = require('../shh/config.json');
const t = require('../jsons/temple.json');
module.exports = {
    name: 'temple',
    aliases: ['t', 'tsg', 'sg', 'monkeygod', 'god', 'totmg', 'vtsg'],
    execute(message, args, client) {
        const commandName = args.shift().toLowerCase();

        /*if (!args[0] || !args[1] || !args[2] || !args[3]) {
      return message.channel.send(
        "the format is q!temple <amount sacrificed in primary> <amount sacrificed in military> <amount sacrificed in magic> <amount sacrificed in support>"
      );
    }*/
        if (commandName != 'tsg') {
            var thayallan =
                '**Recall: 400 Sun Temple has a sunblast attack (5d, 20p, 0.06s, 65r, normal type)**\nWhen sacrificing towers to a Sun Temple, only three categories count. If four categories are sacrificed then the cheapest is ignored.';
        } else if (commandName == 'tsg') {
            var thayallan =
                '**Recall: 500 True Sun God has a sunblast attack (15d, 20p, 0.06s, 65r, normal type)**\nA True Sun God benefits from sacrifices in almost exactly the same way as a Temple, this time from all four categories. It keeps all attacks and buffs it had as a Temple — it simply gets a second copy of attacks. The TSG versions of an attack therefore have subtle differences to help them be visually distinct:\nPrimary\ngold-blade: blades are equally spaced starting from 22.5° (instead of 0°)\ngold-glaive: arcs clockwise (instead of anticlockwise)\nMilitary\nmoab-missile: slightly faster projectile speed\ngold-spectre-1: figure-infinite flight path\ngold-spectre-2: figure-eight flight path\ndamage multipliers add together, for a maximum of 5×\nMagic \narcane-blast: slightly wider spread\npush: none, a TSG can only have one push attack (if magic is sacrificed both times, the highest level is used)\nSupport\nbuff: none, but the buff from TSG sacrifices is considered distinct to the buff from temple sacrifices, and so can stack together (even if it is a separate temple)';
        } else if (commandName == 'vtsg') {
            var thayallan =
                'There Can Be Only One\nMonkey Knowledge has so far been omitted from these posts, but "There Can Be Only One" deserves a mention. This is triggered by upgrading a Super Monkey to 5xx, with maximum sacrifices at both tier 4 and tier 5, while the other two tier 5 Super Monkeys are also on screen (don\'t sacrifice them!\nThey combine into a 555 Super Monkey, commonly (but unofficially) called the "Vengeful True Sun God" or VTSG.\nThis has the following buffs compared to a TSG:\nsunblast buffed: +50d\nall other attacks (including subtowers) buffed: ×3d, stacking multiplicatively with the military buff (so either 9× or 15× depending on sacrifices)';
        }

        let k = [];
        for (i = 0; i < 4; i++) {
            let level;
            if (args[i] < 0) {
                level = -1;
            } else if (args[i] < 300) {
                level = 0;
            } else if (args[i] < 1000) {
                level = 1;
            } else if (args[i] < 2000) {
                level = 2;
            } else if (args[i] < 4000) {
                level = 3;
            } else if (args[i] < 7500) {
                level = 4;
            } else if (args[i] < 10000) {
                level = 5;
            } else if (args[i] < 15000) {
                level = 6;
            } else if (args[i] < 25000) {
                level = 7;
            } else if (args[i] < 50000) {
                level = 8;
            } else {
                level = 9;
            }
            k.push(level);
        }
        const templeEmbed = new Discord.RichEmbed()
            .setDescription(
                "When a super monkey is upgraded to 4xx or 5xx, all non-hero towers in range — including allies' towers, if in co-op — are sacrificed to the super monkey. It gains different attacks and buffs depending on how much was spent on each tower category (primary, military, magic, or support) that is sacrificed.\nThe stats for each level will be written independently of the others, so there is no need to look at any earlier levels to figure out the overall effect. Attacks will be defined first and simply referred to, instead of copying the same stats multiple times."
            )
            .addField('.', thayallan)
            .addField('primary', t['1'][k[0]])
            .addField('military', t['2'][k[1]])
            .addField('magic', t['3'][k[2]])
            .addField('support', t['4'][k[3]]);
        message.channel.send(templeEmbed);
    },
};
