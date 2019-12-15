const Discord = require('discord.js');
module.exports = {
	name: 'map',
    description: 'info about maps',
    aliases: ['m'],
    usage: '!map <map name with perfect spelling>',
	execute(message, args, client) {
        let map = args.join(' ');
        if(map.includes('mm')||(map.includes('monkey')&&map.includes('meadow'))){
            var wbp = 0;
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 0;
            var ver = '1.0';
            var len = 28.5;
            var cli = 0;
            var iin = 3;
            var thumbnail = 'https://cdn.discordapp.com/attachments/604437039328395325/616920817988665344/MonkeyMeadow.jpg'
        }else if(map.includes('ts')||(map.includes('tree')&&map.includes('stump'))){
            var wbp = 0;
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 0;
            var ver = '1.0';
            var len = 38;
            var cli = 13;
            var iin = 1.5;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920780839583770/TreeStump.png'
        }else if(map.includes('tc')||(map.includes('town')&&map.includes('cent'))){
            var wbp = 7;
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 1;
            var ver = '1.0';
            var len = 29.8;
            var cli = 0;
            var iin = 1.5;
            var thumbnail='https://cdn.discordapp.com/attachments/594348433922457610/634032881475256378/Screenshot_20191016_222001.jpg'
        }else if(map.includes('pk')||(map.includes('park')&&map.includes('path'))){
            var wbp = '?';
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = '?';
            var ver = '11.0';
            var len = 34.6;
            var cli = '?';
            var iin = 1;
            var thumbnail= 'https://cdn.discordapp.com/attachments/604437039328395325/616920352802734090/IMG_20190830_115856_636.JPG '
        }else if(map.includes('ar')||(map.includes('alpine')&&map.includes('run'))){
            var wbp = 0;
            var obj = 0;
            var obc = 0;
            var los = 'no';
            var wbc = 0;
            var ver = 0;
            var len = 31.5;
            var cli = 0;
            var iin = 0.5;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920780839583769/Alpine_Run.png'
        }else if(map.includes('fo')||(map.includes('frozen')&&map.includes('over'))){
            var wbp = 7;
            var obj = 0;
            var obc = 0;
            var los = 'yes/no';
            var wbc = 4;
            var ver = '5.0';
            var len = 34.7;
            var cli = 0;
            var iin = 5.5;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920781821313024/Frozen_Over.png'
        }else if(map.includes('itl')||map.includes('loop')){
            var wbp = 2;
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 1;
            var ver = '1.0';
            var len = 38.1;
            var cli = 0;
            var iin = 3;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920748082331648/InTheLoopBTD6.png'
        }else if(map.includes('cu')){
            var wbp = 9;
            var obj = 0;
            var obc = 0;
            var los = 'no';
            var wbc = 2;
            var ver = '1.0';
            var len = 42.3;
            var cli = 0;
            var iin = 6.5;
            var thumbnail='https://cdn.discordapp.com/attachments/594624229958352906/616238947311288320/CubismBTD6.png'
        }else if(map.includes('fc')||(map.includes('four')&&map.includes('circles'))){
            var wbp = 3;
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 2;
            var ver = 0;
            var len = 35.6;
            var cli = 0;
            var iin = 5;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920746920247306/FourCirclesBTD6.png'
        }else if(map.includes('hd')||map.includes('hedge')){
            var wbp = 0;
            var obj = 0;
            var obc = 0;
            var los = '1.0';
            var wbc = 0;
            var ver = 0;
            var len = '39?';
            var cli = 1;
            var iin = 1;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920746106683412/HedgeBTD6.png'
        }else if(map.includes('log')){
            var wbp = 2;
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 1;
            var ver = '1.0';
            var len = '53?';
            var cli = 12;
            var iin = 11;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920818412158982/LogsBTD6.png'
        }else if(map.includes('eo')||(map.includes('end')&&map.includes('road'))){
            var wbp = 3;
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 1;
            var ver = '1.0';
            var len = 25.9;
            var cli = 0;
            var iin = '1 (excluding large overlap)';
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920689085120563/EndofRoadNew.jpg'
        }else if(map.includes('ss')||map.includes('spring')){
            var wbp = 45;
            var obj = 0;
            var obc = 0;
            var los = 'no';
            var wbc = 1;
            var ver = '10.0';
            var len = '30?';
            var cli = 0;
            var iin = 2;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920688183476235/Spring_Spring.png'
        }else if(map.includes('ka')||(map.includes('darts')&&map.includes('n'))){
            var wbp = 0;
            var obj = 2;
            var obc = 1000;
            var los = 'no';
            var wbc = 0;
            var ver = '8.0';
            var len = 33;
            var cli = 0;
            var iin = 3;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920353947516928/IMG_20190830_115844_727.JPG'
        }else if(map.includes('ml')||(map.includes('moon')&&map.includes('land'))){
            var wbp = 0;
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 0;
            var ver = '6.0';
            var len = 36;
            var cli = 0;
            var iin = 3;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920688183476234/Moon_Landing.png'
        }else if(map.includes('hau')){
            var wbp = 4;
            var obj = 2;
            var obc = 700;
            var los = 'yes/no';
            var wbc = 1;
            var ver = '5.0';
            var len = 18.2;
            var cli = 0;
            var iin = 0;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920643903946752/Haunted.png'
        }else if(map.includes('ds')||map.includes('downstream')){
            var wbp = 12;
            var obj = 2;
            var obc = 700;
            var los = 'yes';
            var wbc = 1;
            var ver = '4.0';
            var len = 25.7;
            var iin = 2;
            var cli = '?';
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920353947516929/IMG_20190830_115830_843.JPG'
        }else if(map.includes('fr')||(map.includes('fir')&&map.includes('rang'))){
            var wbp = '?';
            var obj = 1;
            var obc = 1000;
            var los = 'yes/no';
            var wbc = 1;
            var ver = '2.0';
            var len = 29.1;
            var cli = '?';
            var iin = 1;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920643006496768/F0D3485E-093D-46A4-AC11-005A93A918DF.jpg'
        }else if(map.includes('cr')){
            var wbp = '0/?';
            var obj = 1;
            var obc = 1000;
            var los = 'yes';
            var wbc = '0/1';
            var ver = '1.0';
            var len = 32.5;
            var cli = '?';
            var iin = 1.5;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920603449884672/CrackedBTD6.png'
        }else if(map.includes('sb')||map.includes('streambed')){
            var wbp = '?';
            var obj = 1;
            var obc = 1000;
            var los = 'yes';
            var wbc = 1;
            var ver = '1.0';
            var len = 26.5;
            var cli = "'?";
            var iin = 1.5;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920605211623435/StreambedBTD6.png'
        }else if(map.includes('ch')){
            var wbp = '?';
            var obj = 2;
            var obc = 700;
            var los = 'yes/no';
            var wbc = 2;
            var ver = '1.0';
            var len = 15.7;
            var cli = '?';
            var iin = 0;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920604343533581/ChutesBTD6.png'
        }else if(map.includes('ra')){
            var wbp = '?';
            var obj = 1;
            var obc = 1000;
            var los = 'yes/no';
            var wbc = 1;
            var ver = '1.0';
            var len = 'top path 15.7, left path 15.3';
            var cli = '?';
            var iin = 1.5;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920494976925696/RakeBTD6.png'
        }else if(map.includes('si')||(map.includes('spice')&&map.includes('island'))){
            var wbp = '?';
            var obj = 1;
            var obc = 1000;
            var los = 'yes/no';
            var wbc = 1;
            var ver = '1.0';
            var len = 23.3;
            var cli = '?';
            var iin = 0;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920495870181376/SpiceIslandBTD6.png'
        }else if(map.includes('pa')||(map.includes('pat')&&map.includes('pond'))){
            var wbp = '?';
            var obj = 4;
            var obc = 2000;
            var los = 'yes/no';
            var wbc = 1;
            var ver = '9.0';
            var len = 'right path 14.0, left path 13.4';
            var cli = '?';
            var iin = 0;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920643006496769/Pats_Pond.png'
        }else if(map.includes('pe')){
            var wbp = '?';
            var obj = 3;
            var obc = 1500;
            var los = 'yes';
            var wbc = 1;
            var ver = '7.0';
            var len = 13.9;
            var cli = '?';
            var iin = -1;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920353515634698/IMG_20190830_115809_002.JPG'
        }else if(map.includes('hf')||(map.includes('high')&&map.includes('finance'))){
            var wbp = '?';
            var obj = 15;
            var obc = 12550;
            var los = 'yes';
            var wbc = 0;
            var ver = '3.0';
            var len = 'right path 26.8, top path 15.2';
            var cli = '?';
            var iin = 0;
            var thumbnail = 'https://cdn.discordapp.com/attachments/604437039328395325/616920354648227841/IMG_20190830_115757_493.JPG'
        }else if(map.includes('ab')||(map.includes('another')&&map.includes('brick'))){
            var wbp = '?';
            var obj = 2;
            var obc = 2000;
            var los = 'yes';
            var wbc = 2;
            var ver = '1.0';
            var len = '20?';
            var cli = '?';
            var iin = 0;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920496562503690/AnotherbrickBTD6.png'
        }else if(map.includes('ot')||(map.includes('off')&&map.includes('coast'))){
            var wbp = '?';
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 1;
            var ver = '1.0';
            var len = 18.9;
            var cli = '?';
            var iin = 0;
            var thumbnail= 'https://cdn.discordapp.com/attachments/604437039328395325/616920466275172384/OffTheCoastBTD6.png'
        }else if(map.includes('co')){
            var wbp = 0;
            var obj = 13;
            var obc = 9300;
            var los = 'esy';
            var wbc = 0;
            var ver = '1.0';
            var len = '24?';
            var cli = '?';
            var iin = 0.5;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920467915276309/CornfieldBTD6.png'
        }else if(map.includes('un')){
            var wbp = 0;
            var obj = 0;
            var obc = 0;
            var los = 'yes';
            var wbc = 0;
            var ver = '1.0';
            var len = 'bottom path 12.9, top path 12.6';
            var cli = '?';
            var iin = 0.5;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920467101712384/UndergroundBTD6.png'
        }else if(map.includes('qu')){
            var wbp = '?';
            var obj = 4;
            var obc = 6000;
            var los = 'yes/no';
            var wbc = 1;
            var ver = '6.0';
            var len = 'vertical path 11.0, horizontal path 12.1';
            var cli = '?';
            var iin = 0;
            var thumbnail= 'https://cdn.discordapp.com/attachments/604437039328395325/616920434809765908/Quad.png'
        }else if(map.includes('dc')||(map.includes('dark')&&map.includes('castle'))){
            var wbp = '?';
            var obj = 4;
            var obc = '4000';
            var los = 'yes';
            var wbc = 1;
            var ver = '6.0';
            var len = 'outer path 9.8, middle path 8.8';
            var cli = '?';
            var iin = 0;
            var thumbnail = 'https://cdn.discordapp.com/attachments/594348433922457610/634031789324763175/Screenshot_20191016_221549.jpg'
        }else if(map.includes('mp')||(map.includes('muddy')&&map.includes('puddles'))){
            var wbp = '?';
            var obj = 0;
            var obc = 0;
            var los = 'no';
            var wbc = 3;
            var ver = '1.0';
            var len = 9.4;
            var cli = '?';
            var iin = -4;
            var thumbnail='https://cdn.discordapp.com/attachments/604437039328395325/616920354648227840/MudPud.jpg'
        }else if(map.includes('ou')||map.includes('#')){
            var wbp = '?';
            var obj = 1;
            var obc = 1000;
            var los = 'no';
            var wbc = '1/0';
            var ver = '1.0';
            var len = 'horizontal path 10.0, vertical path 7.8';
            var cli = '?';
            var iin = 0;
            var thumbnail = 'https://cdn.discordapp.com/attachments/594348433922457610/634030385113595914/Screenshot_20191016_221002.jpg'
        }else if(map.includes('cg')||map.includes('cargo')){
            var wbp = '?';
            var obj = '?';
            var obc = '?';
            var los = yes;
            var wbc = '?';
            var ver = '?';
            var len = 'left path 13.7, bottom path 11.4';
            var cli = '?';
            var iin = -1;
            var thumbnail = 'https://cdn.discordapp.com/attachments/594348433922457610/634030801620697113/Screenshot_20191016_221153.jpg'
        }else if(map.includes('cv')||map.includes('carved')){
            var wbp = '?';
            var obj = '?';
            var obc = '?';
            var los = yes;
            var wbc = 2;
            var ver = '?';
            var len = 39.2;
            var cli = '?';
            var iin = '?';
            var thumbnail = 'https://cdn.discordapp.com/attachments/629933199241510922/642749385532243982/Screenshot_20191109_233620.jpg'
        }else if(map.includes('bp')||(map.includes('bloody')&&map.includes('puddles'))){
            var wbp = '?';
            var obj = '?';
            var obc = '? ';
            var los = 'no';
            var wbc = '?';
            var ver = '1.0';
            var len = 9.17;
            var cli = '?';
            var iin = '>4?';
            var thumbnail='https://cdn.discordapp.com/attachments/629933199241510922/642749622804021258/Screenshot_20191109_233724.jpg'
        }else{
            return message.channel.send('cant seem to find that map. might want to check the spelling. here is all i can find from it:')
        }
        if (wbp===undefined){
            var wbp = '\u200B'
        }if (cli===undefined){
            var cli = '\u200B'
        }if (los===undefined){
            var los = '\u200B'
        }
        const mapEmbed = new Discord.RichEmbed()
            //.setColor(colour)
            .setTitle('Map info')
            .setAuthor('Cyber Quincy')
            .setDescription(`Here is your info for ${map}`)
            .setThumbnail(`${thumbnail}`)
            .addField('Map length', `${len}RBS`, true)
            .addField('Object count:', `${obj}`, true)
            .addField('Total $ to clear out all the objects', `$${obc}`, true)
            .addField('Intersect index:',`${iin}`,true)
            .addField('Version added:',`${ver}`,true)
            .addField('Water body count:',`${wbc}`,true)
            .addField('Water body percentage',`${wbp}`,true)
            .addField('Line of sight obstructions',`${los}`,true)
            .addField('Clickable interact',`${los}`,true)
            .addField('Bug reporting','report [here](https://discord.gg/8agRm6c)',true)
            .setFooter('I am Quincy, Evolved from quincy.', 'https://vignette.wikia.nocookie.net/b__/images/0/0c/QuincyCyberPortraitLvl20.png/revision/latest/scale-to-width-down/179?cb=20190612022025&path-prefix=bloons');
            message.channel.send(mapEmbed)

    },
};