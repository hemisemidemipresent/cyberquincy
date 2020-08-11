const Discord = require('discord.js');
const { cyber } = require('../jsons/colours.json');
module.exports = {
    name: 'emote',
    description: 'emojis',
    aliases: ['emoji'],
    usage: '<path1> <path2> <path3>',
    execute(message, args) {
        message.delete();
        if (!args) {
            return message.channel.send('q!emoji help');
        }
        if (args[0] == 'all') {
            let emojisGuild = message.guild.emojis.array().join(' ');
            let emojisArray = Discord.splitMessage(emojisGuild, {
                maxLength: 1024,
                char: ' ',
            });
            if (typeof emojisArray === 'string') emojisArray = [emojisArray];

            const emojiEmbed = new Discord.MessageEmbed()
                .setTitle(
                    'There Are ' +
                        message.guild.emojis.size +
                        ' Emojis on ' +
                        message.guild.name
                )
                .setColor(cyber)
                .setDescription('These Are All The Emojis:')
                .setThumbnail(message.guild.iconURL);
            emojisArray.forEach((emojis, i) => {
                embed.addField(`Page ${i + 1}:`, emojis);
            });
            message.channel.send(emojiEmbed);
        }
        if (args[0].includes('bloonr')) {
            message.channel.send(
                '<:Red:654115974856835094> <:Blue:654116225655373834> <:Green:654118914015625266> <:Yellow:654116404567474188> <:Pink:654116034264956948> <:Black:654115811912450060> <:White:654116467087769600> <:Lead:654115684472848416>  <:Zebra:654115748305698816> <:Rainbow:654119071847022624> <:Ceram:654116160517963788> <:MOAB:653463228755738624> <:BFB:653463095699832846> <:ZOMG:653463343339798538><:BAD:653463574458662912> <:3DT:644656713009594407>'
            );
        } else if (args[0] == 'supermonkey') {
            if (args[1] == 'happy') {
                message.channel.send(
                    '<a:Supermonkey_Happy:408048296154628096>'
                );
            } else if (args[1] == 'sleep') {
                message.channel.send(
                    '<a:Supermonkey_Sleepy:408048528146038784>'
                );
            } else if (args[1] == 'dizzy') {
                message.channel.send(
                    '<a:Supermonkey_Dizzy:429614433019494410>'
                );
            } else if (args[1] == 'cry') {
                message.channel.send('<a:Supermonkey_Cry:429614578746261504>');
            } else if (args[1] == 'eyebrows') {
                message.channel.send(
                    '<a:Supermonkey_Eyebrows:429614648724291605>'
                );
            }
            //message.channel.send('<a:Supermonkey_Happy:408048296154628096>\n<a:Supermonkey_Sleepy:408048528146038784>\n<a:Supermonkey_Dizzy:429614433019494410>\n<a:Supermonkey_Cry:429614578746261504>\n<a:Supermonkey_Eyebrows:429614648724291605>')
        } else if (args[0].includes('dr')) {
            if (args[1] == 'nod') {
                message.channel.send('<a:DrMonkey_Nod:429614777833226251>');
            } else if (args[1] == 'shake') {
                message.channel.send('<a:DrMonkey_Shake:429614787345776650>');
            }
        } else if (args[0].includes('crouch')) {
            message.channel.send('<a:Crouching_Ninja:408047841563377664>');
        } else if (args[0] == 'bfb') {
            message.channel.send(
                '<a:rohan:408044760331452416><a:rohan2:408045435005960204>'
            );
        } else if (args[0] == 'cry') {
            message.channel.send('<a:cry:644398761409511434>');
        } else if (args[0] == 'wink') {
            message.channel.send('<a:wink:647313341340975108>');
        } else if (args[0] == 'ben') {
            if (!args[1]) {
                return message.channel.send(
                    '<a:BenjaminSpin:701683466181279784>'
                );
            }
            if (args[1] == 'fast') {
                return message.channel.send(
                    '<a:BenjaminSpinFAST:701683465958981683>'
                );
            }
            message.channel.send('<a:ben:647819957861744718>');
        } else if (args[0] == 'thonk') {
            message.channel.send('<a:dartythonk:647819976102641702>');
        } else if (args[0] == 'no') {
            message.channel.send('<a:no:647819990447292457>');
        } else if (args[0] == 'yes') {
            message.channel.send('<a:yes:647820009493626892>');
        } else if (args[0] == 'pink') {
            message.channel.send(
                '<a:pink1:647821652218085376> <a:pink2:647821634408939531> <a:pink3:647821621708587019>'
            );
        } else if (args[0] == 'marine') {
            if (args[1] == 'big') {
                message.channel.send(
                    '<a:11:665385432988647435><a:12:665385434574094347><a:13:665385435559755816><a:14:665385434821427240><a:15:665385433873514517><a:16:665385432103649330><a:17:665385432523210772>\n<a:21:665385433974439968><a:22:665385435303772170><a:23:665385434746191876><a:24:665385434855243786><a:25:665385435257634865><a:26:665385432686788609><a:27:665385432510365716>\n<a:31:665385434150469633><a:32:665385435735916544><a:33:665385435740241937><a:34:665385435861876763><a:35:665385436415262741><a:36:665385433013944361><a:37:665385432422547476>'
                );
                message.channel.send(
                    '<a:41:665385434045612052><a:42:665385435303903243><a:43:665385435610218497><a:44:665385436491022346><a:45:665385436000026634><a:46:665385432204181526><a:47:665385432510627880>\n<a:51:665385432489656321><a:52:665385434297401356><a:53:665385435798700062><a:54:665385435455029278><a:55:665385435588984860><a:56:665385433621856256><a:57:665385431944134656>\n<a:61:665385431474634773><a:62:665385433294962702><a:63:665385435211759667><a:64:665385436318924800><a:65:665385436025323550><a:66:665385435429732383><a:67:665385432401313802>'
                );
                message.channel.send(
                    '<a:71:665385431352868877><a:72:665385431218651174><a:73:665385431680155711><a:74:665385431642144778><a:75:665385432065769477><a:76:665385431688413185><a:77:665385431801528330>'
                );
            } else {
                message.channel.send(
                    '<a:m1:648343849973841923><a:m2:648341891015901185><a:m3:648341904705978386><a:m4:648341917804789821>\n<a:m5:648343886032404481><a:m6:648343901576364052><a:m7:648343914008543262><a:m8:648343935068012544>\n<a:m9:648343952138960896><a:m10:648343967615942687><a:m11:648343979967905803><a:m12:648343991594778634>\n<a:m13:648344004148330507><a:m14:648344017850990605><a:m15:648344035601285121><a:m16:648344048918331392>'
                );
            }
        } else if (args[0] == 'help') {
            const helpembed = new Discord.MessageEmbed()
                .setTitle('Emoji help page')
                .setDescription(
                    'how to use it:\nthere are 2 types of text here'
                )
                .addField('top text', 'bottom text')
                .addField(
                    'usage:',
                    'q!emoji ``<top text>`` ``<bottom text>``(select **one** bottom text)\n**e.g.q!emoji supermonkey happy**'
                )
                .addField('supermonkey', 'happy,sleep,dizzy,cry,eyebrows', true)
                .addField('drmonkey', 'nod,shake', true)
                .addField('**crouch**', '(just use q!emoji crouch)', true)
                .addField('**bfb**', 'again, just use ``q!emoji bfb``', true)
                .addField('**cry**', 'just like the previous', true)
                .addField('**ben**', 'just like the previous', true)
                .addField('**thonk**', 'just like the previous', true)
                .addField('**no**', 'just like the previous', true)
                .addField('**yes**', 'just like the previous', true)
                .addField('**marine**', 'do i need to state the obvious?', true)
                .addField('**pink**', 'come on', true)
                .setFooter('your message will be deleted');
            message.channel.send(helpembed);
        } else if (args[0] == 'rohan') {
            if (args[1]) {
                return message.channel.send(
                    '<a:RohanBounceFAST:701679547342520405>'
                );
            }
            return message.channel.send('<a:RohanBounce:701679547405434940>');
        } else if (args[0].includes('str') || args[0].includes('jon')) {
            return message.channel.send(
                '<a:StrikerJonesScream:701658002364563497>'
            );
        }
    },
};
