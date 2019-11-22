const Discord = require('discord.js')
module.exports = {
	name: 'emote',
    description: 'emojis', 
    aliases: ['emoji'],
    usage:'<path1> <path2> <path3>',
	  execute(message, args) {
      message.delete()
      if (args[0]=='supermonkey'){
        if (args[1]=='happy'){
          message.channel.send('<a:Supermonkey_Happy:408048296154628096>')
        }else if (args[1]=='sleep'){
          message.channel.send('<a:Supermonkey_Sleepy:408048528146038784>')
        }else if (args[1]=='dizzy'){
          message.channel.send('<a:Supermonkey_Dizzy:429614433019494410>')
        }else if (args[1]=='cry'){
          message.channel.send('<a:Supermonkey_Cry:429614578746261504>')
        }else if (args[1]=='eyebrows'){
          message.channel.send('<a:Supermonkey_Eyebrows:429614648724291605>')
        }
        //message.channel.send('<a:Supermonkey_Happy:408048296154628096>\n<a:Supermonkey_Sleepy:408048528146038784>\n<a:Supermonkey_Dizzy:429614433019494410>\n<a:Supermonkey_Cry:429614578746261504>\n<a:Supermonkey_Eyebrows:429614648724291605>')
      }else if (args[0].includes('dr')){
        if(args[1]=='nod'){
          message.channel.send('<a:DrMonkey_Nod:429614777833226251>')
        }else if (args[1]=='shake'){
          message.channel.send('<a:DrMonkey_Shake:429614787345776650>')
        }
        
      }else if (args[0].includes('crouch')){
        message.channel.send('<a:Crouching_Ninja:408047841563377664>')
      }else if(args[0]=='bfb'){
        message.channel.send('<a:rohan:408044760331452416><a:rohan2:408045435005960204>')
      }else if(args[0]=='cry'){
		  message.channel.send('<a:cry:644398761409511434>')
	  }else if(args[0]==help){
      const helpembed = new Discord.RichEmbed()
      .setTitle('Emoji help page')
      .setDescription('how to use it:\nthere are 2 types of text here:\ntop text\n**bottom text(s)**\nuse it like so:\nq!emoji ``<top text>`` ``<bottom text>``(select **one** bottom text)\n**e.g.q!emoji supermonkey ha[[y')
      .addField('supermonkey','happy,sleep,dizzy,cry,eyebrows',true)
      .addField('drmonkey','nod,shake',true)
      .addField('**crouch**','(just use q!emoji crouch)',true)
      .addField('**bfb**','again, just use ``q!emoji bfb``',true)
      .addField('**cry**','just like the previous',true)
    }
    
    },
};