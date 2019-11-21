const t = require('../towers.json')
const Discord = require('discord.js')
const {colour} = require('../config.json')
module.exports = {
	name: 'dart',
    description: 'dart upgrades desc', 
    aliases: ['dm'],
    usage:'<path1> <path2> <path3>',
	  execute(message, args) {
        let name = 'dart'
        var path1=Math.floor(parseInt(args[0])/100)
        var path2=Math.floor((parseInt(args[0])-path1*100)/10)
        var path3=parseInt(args[0]-path1*100-path2*10);
        if (path2<1&&path3<1){
            var path =1
        }else if (path1<1&&path3<1){
            var path=2
        }else if (path1<1&&path2<1){
            var path=3
        }
        switch(path){
            case 1: var tier = path1
            break;
            case 2: var tier = path2
            break;
            case 3: var tier = path3
            break;
        }
        var u = t[name][`s${path}${tier}`]
        if (args[0]==='help'){
            message.channel.send(`I cant recognise what you sent, here is the syntax fo the command: \`\`${name}\`\` \`\`<path1>`` ``<path2>`` ``path3>``. e.g. (q!ace 003 provides the description for the third upgrade on the third path) please remember that crosspaths e.g.(q!ace 205) are not accepted. All upgrades provided by topper64\'s advanced popology`)
        }else if (path===0||tier==0||args[0]==='base'){
            var u = t[name]['base']
        }if (u === undefined ){
          message.channel.send(`I cant recognise what you sent, here is the syntax fo the command: \`\`${name}\`\` \`\`<path1>`` ``<path2>`` ``path3>``. e.g. (q!ace 003 provides the description for the third upgrade on the third path) please remember that crosspaths e.g.(q!ace 205) are not accepted. All upgrades provided by topper64\'s advanced popology`)
        }else{
            let de = u.desc
            let na = u.name
            let co = u.cost
            const infoembed = new Discord.RichEmbed()
                .addField('name',`${na}`)
                .addField('cost',`$${co} (on medium)`)
                .addField('description',`${de}`)
                .setColor(colour)
            message.channel.send(infoembed)
        }
    
    },
};