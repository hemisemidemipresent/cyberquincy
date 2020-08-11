const Discord = require('discord.js');
const { cyber } = require('../jsons/colours.json');
module.exports = {
    name: 'challenge',
    aliases: ['rc', 'randomc', 'random', 'rchallenge', 'rch'],

    usage: '[command name]',
    execute(message, args) {
        // what the fuck is this idk
        let heroyn = Math.floor(Math.random() * 2);
        let mapdiff = Math.floor(Math.random() * 4);
        let startround = Math.ceil(Math.random() * 100);
        let endround = startround + Math.ceil(Math.random() * 30);
        let towerCount = Math.ceil(Math.random() * 15);
        let modeid = Math.floor(Math.random() * 10);
        const lives = Math.ceil(Math.random() * 400);
        const mkyn = Math.floor(Math.random() * 2);
        const camoyn = Math.floor(Math.random() * 2);
        const regrow = Math.floor(Math.random() * 2);
        const sell = Math.floor(Math.random() * 2);
        const cont = Math.floor(Math.random() * 2);
        const bspeed = Math.floor(Math.random() * 495) + 5;
        const Bspeed = Math.floor(Math.random() * 495) + 5;
        const Bhealth = Math.floor(Math.random() * 1995) + 5;
        const chealth = Math.floor(Math.random() * 1990) + 10;
        let hero = 'none';
        const heroArray = [
            'Quincy',
            'Gwendolyn',
            'Obyn',
            'Striker Jones',
            'Pat Fusty',
            'Benjamin',
            'Ezili',
            'Churchill',
            'adora',
        ];
        const mapArray = [
            [
                'monkey meadow',
                'tree stump',
                'town center',
                'alpine run',
                'frozen over',
                'in the loop',
                'cubism',
                'four circles',
                'end of the road',
                'hedge',
                'logs',
            ],
            [
                'Spring Spring',
                'KartsNDarts',
                'Moon Landing',
                'Haunted',
                'Firing range',
                'cracked',
                'streambed',
                'Chutes',
                'Rake',
                'Spice islands',
            ],
            [
                'spillway',
                'cargo',
                "pat's pond",
                'peninsula',
                'high finance',
                'another brick',
                'off the coast',
                'underground',
                'Cornfield',
                'Geared',
            ],
            [
                'workshop',
                '#ouch',
                'muddy puddles',
                'quad',
                'Dark castle',
                'Infernal',
            ],
        ];
        const modes = [
            'apopalypse',
            'half cash',
            'deflation',
            'easy',
            'medium',
            'hard',
            'impoppable',
            'CHIMPS',
            'Double HP MOABs',
            'Alternate Bloon Rounds',
        ];
        const mode = modes[modeid];
        if (!heroyn) {
            hero = heroArray[Math.ceil(Math.random() * 9)];
        }
        const randomMap = Math.floor(Math.random() * mapArray[mapdiff].length);
        map = mapArray[mapdiff][randomMap];

        Math.floor(Math.random() * 21);
        let towerArray = [
            'dart',
            'boomerang',
            'bomb',
            'tack',
            'ice',
            'glue',
            'sub',
            'boat',
            'heli',
            'ace',
            'sniper',
            'mortar',
            'wizard',
            'super',
            'druid',
            'alchemist',
            'ninja',
            'farm',
            'spike factory',
            'engineer',
            'village',
        ];
        let monkeys = [];
        for (i = 0; i < towerCount; i++) {
            monkeys.push(towerArray[Math.floor(Math.random() * 21)]);
        }
        const cash =
            600 +
            100 * startround +
            startround * startround * Math.ceil(Math.random() * 10);

        const DEarr = ['enabled', 'disabled']; // honestly and abomination
        const MK = DEarr[mkyn];
        const grow = DEarr[regrow];
        const camo = DEarr[camoyn];
        const selling = DEarr[sell];
        const continues = DEarr[cont];
        const ChallengeEmbed = new Discord.MessageEmbed()
            .setTitle(`Random Challenge generated`)
            .setColor(cyber)
            .addField('Map', `${map}`, true)
            .addField('Hero', `${hero}`, true)
            .addField('mode', `${mode}`, true)
            .addField('lives', `${lives}`)
            .addField('starting cash', `${cash}`, true)
            .addField('round', `${startround} to ${endround}`, true)
            .addField(`monkeys`, `${monkeys}`, true)
            .addField(
                'other settings',
                ` MK ${MK}, all regrow ${grow}, all camo ${camo}, seling ${selling}, continues ${continues}`,
                true
            )
            .addField('bloon speed', bspeed)
            .addField('Blimp speed', Bspeed, true)
            .addField('ceramic health', chealth, true)
            .addField('Blimp health', Bhealth, true)
            .addField(
                'it is reccomended to tweak a few of these factors to mkae the challenge more intresting, instead of blindly copying from here.'
            )
            .addField(
                'this command is prone to errors',
                'pls click [here](https://discord.gg/VMX5hZA) to report bugs and and get help, or just chill out'
            );
        message.channel.send(ChallengeEmbed);
    },
};
