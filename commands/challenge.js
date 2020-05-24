const Discord = require('discord.js');
module.exports = {
    name: 'rc',
    aliases: ['rc', 'randomc', 'random', 'rchallenge', 'rch'],
    description:
        'very epic thing inspired from https://unforgivenjake.github.io/btd6rc/',
    usage: '[command name]',
    execute(message, args, client) {
        // what the fuck is this idk
        let heroyn = Math.floor(Math.random() * 2);
        let mapdiff = Math.ceil(Math.random() * 4);
        let startround = Math.ceil(Math.random() * 100);
        let endround = startround + Math.ceil(Math.random() * 30);
        let primarycount = Math.floor(Math.random() * 5);
        let militarycount = Math.floor(Math.random() * 5);
        let magiccount = Math.floor(Math.random() * 3);
        let supportcount = Math.floor(Math.random() * 2);
        let modeid = Math.floor(Math.random() * 10);
        let lives = Math.ceil(Math.random() * 400);
        let mkyn = Math.floor(Math.random() * 2);
        let camoyn = Math.floor(Math.random() * 2);
        let regrow = Math.floor(Math.random() * 2);
        let sell = Math.floor(Math.random() * 2);
        let cont = Math.floor(Math.random() * 2);
        let bspeed = 100 + Math.floor((Math.random() - 1) * 10);
        let Bspeed = 100 + Math.floor((Math.random() - 1) * 10);
        let Bhealth = 100 + Math.floor((Math.random() - 1) * 10);
        let chealth = 100 + Math.floor((Math.random() - 1) * 10);
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
        if (!heroyn) {
            hero = heroArray[Math.ceil(Math.random() * 9)];
        }
        const random = Math.floor(Math.random() * mapArray[mapdiff].length);
        map = mapArray[mapdiff][random];
        const primary = ['dart', 'boomerang', 'bomb', 'tack', 'ice', 'glue'];
        const primarycopy = [...primary];
        let primarygenerated = [];
        for (i = 0; i < primarycount; i++) {
            let ranprimaryindex = Math.floor(
                Math.random() * primarycopy.length
            );
            primarygenerated.push(primarycopy[ranprimaryindex]);
            primarycopy.splice(ranprimaryindex, 1);
        }
        let primarymonkeys = primarygenerated.toString();
        if (primarygenerated.length === 0) {
            primarymonkeys = ' ';
        }
        //military
        let military = ['sub', 'boat', 'heli', 'ace', 'sniper', 'mortar'];
        let militarycopy = [...military];
        let militarygenerated = [];
        for (i = 0; i < militarycount; i++) {
            let ranmilitaryindex = Math.floor(
                Math.random() * militarycopy.length
            );
            militarygenerated.push(militarycopy[ranmilitaryindex]);
            militarycopy.splice(ranmilitaryindex, 1);
        }
        let militarymonkeys = militarygenerated.toString();
        if (militarygenerated.length === 0) {
            militarymonkeys = ' ';
        }
        //magic
        let magic = ['wizard', 'super', 'druid', 'alchemist', 'ninja'];
        let magiccopy = [...magic];
        let magicgenerated = [];
        for (i = 0; i < magiccount; i++) {
            let ranmagicindex = Math.floor(Math.random() * magiccopy.length);
            magicgenerated.push(magiccopy[ranmagicindex]);
            magiccopy.splice(ranmagicindex, 1);
        }
        let magicmonkeys = magicgenerated.toString();
        if (magicgenerated.length === 0) {
            magicmonkeys = ' ';
        }
        //support
        let support = ['farm', ' spactory', 'engineer', 'village'];
        let supportcopy = [...support];
        let supportgenerated = [];
        for (i = 0; i < supportcount; i++) {
            let ransupportindex = Math.floor(
                Math.random() * supportcopy.length
            );
            supportgenerated.push(supportcopy[ransupportindex]);
            supportcopy.splice(ransupportindex, 1);
        }
        let supportmonkeys = supportgenerated.toString();
        if (supportgenerated.length === 0) {
            supportmonkeys = ' ';
        }
        let modes = [
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
        let mode = modes[modeid];
        let cash =
            600 +
            100 * startround +
            startround * startround * Math.ceil(Math.random() * 10);

        if (
            primarymonkeys == ' ' &&
            militarymonkeys == ' ' &&
            magicmonkeys == ' ' &&
            supportmonkeys == ' '
        ) {
            let yee = Math.floor(Math.random() * 21);
            let monkeys = [
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
                ' spactory',
                'engineer',
                'village',
            ];
            primarymonkeys = monkeys[yee];
        }
        if (mode === 'impoppable' || mode === 'CHIMPS') {
            lives = 1;
        }
        const DEarr = ['enabled', 'disabled']; // honestly and abomination
        const MK = DEarr[mkyn];
        const grow = DEarr[regrow];
        const camo = DEarr[camoyn];
        const selling = DEarr[sell];
        const continues = DEarr[cont];
        const ChallengeEmbed = new Discord.MessageEmbed()
            .setTitle(`Random Challenge generated`)
            .setColor('#00E6BB')
            .addField('Map', `${map}`)
            .addField('Hero', `${hero}`)
            .addField('mode', `${mode}`)
            .addField('lives', `${lives}`)
            .addField('starting cash', `${cash}`)
            .addField('round', `${startround} to ${endround}`)
            .addField(
                `monkeys`,
                `${primarymonkeys},${militarymonkeys},${magicmonkeys},${supportmonkeys}`
            )
            .addField(
                'other settings',
                ` MK ${MK}, all regrow ${grow}, all camo ${camo}, seling ${selling}, continues ${continues}`
            )
            .addField('bloon speed', bspeed)
            .addField('Blimp speed', Bspeed)
            .addField('ceramic health', chealth)
            .addField('Blimp health', Bhealth)
            .addField(
                'it is reccomended to tweak a few of these factors to mkae the challenge more intresting, instead of blindly copying from here.'
            )
            .addField(
                'this command is prone to errors',
                'pls click [here](https://discord.gg/VMX5hZA) to report bugs and and support'
            );
        message.channel.send(ChallengeEmbed);
    },
};
