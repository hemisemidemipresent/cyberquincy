//no touchy touchy
const keepAlive = require('./server');
const fs = require('fs');
const Discord = require('discord.js');
const { prefix,colour, token} = require('./config.json');
const package = require('./package-lock.json')
const version = package.version
const xp = require('./xp.json')
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}
const cooldowns = new Discord.Collection();
client.once('ready', () => {
    let channel = client.guilds.get('598768024761139240').channels.get('644712318222991374');
	//let server = client.guilds.map(g=>g.name)
	//console.log(server)
	//let servers = client.guilds.find(name=>name='Cyber Quincy Bot Support')
	//let invite = servers.fetchInvites()
	//console.log(servers)
	//console.log(invite)
    channel.send('restarted!');
    console.log('Ready!');
    client.user.setActivity(`${prefix}help for help.`);
});
//641911773208772608
//Mdwb3P0OGh4018TaSBHx7cw0JAlr7cXegURIs0MJXU_wPRMUlR4O9dlofXaqr_TpylIe
function hook(img1, img2){
    client.fetchWebhook('641230865082482708', 'UufFBR5LEY5NcmAEqz67-yuqQr7XBtAGTGZ3Cr4rhTB6vR0TMIKo-l63KAnrS_HQLfTc')
        .then(webhook => {
            console.log(`Obtained webhook with name: ${webhook.name}`)
            webhook.send({
                files: [img1]
              })
                //.then(console.log)
                .catch(console.error);
            
            webhook.send({
                files: [img2]
              })
                //.then(console.log)
                .catch(console.error);
            })
        .catch(console.error)
    client.fetchWebhook('641911773208772608', 'Mdwb3P0OGh4018TaSBHx7cw0JAlr7cXegURIs0MJXU_wPRMUlR4O9dlofXaqr_TpylIe')
        .then(webhook => {
            console.log(`Obtained webhook with name: ${webhook.name}`)
            webhook.send({
                files: [img1]
              })
                //.then(console.log)
                .catch(console.error);
            
            webhook.send({
                files: [img2]
              })
                //.then(console.log)
                .catch(console.error);
            })
        .catch(console.error)
    /*
    client.fetchWebhook('641911773208772608', 'Mdwb3P0OGh4018TaSBHx7cw0JAlr7cXegURIs0MJXU_wPRMUlR4O9dlofXaqr_TpylIe')
        .then(webhook => {
            console.log(`Obtained webhook with name: ${webhook.name}`)
            webhook.send({
                files: [img1]
              })
                //.then(console.log)
                .catch(console.error);
            
            webhook.send({
                files: [img2]
              })
                //.then(console.log)
                .catch(console.error);
            })
        .catch(console.error)
    */
}
client.on('guildCreate',guild =>{
    var channeltosend = guild.channels.find(channel => channel.name.includes('general')===true);
    if (channeltosend === null){
        return console.log('wtf')
    }else{
    const helpembed = new Discord.RichEmbed()
        .setColor(colour) 
        .setDescription(`Hi! I am Cyber Quincy. I am a btd6 bot.`)
        .addField('general information:','[List of commands](https://docs.google.com/document/d/1NJqQ82EUP6yTri1MV63Pbk-l_Lo_WKXCndH7ED8retY/edit?usp=sharing)\n[support server](https://discord.gg/8agRm6c)')
        .addField('Please note that this bot\'s name and avatar are owned by ninja Kiwi. This bot has no association with them.')
        .addField(`use ${prefix}help <command name> for help on that command`,`use ${prefix}info for more information`)
        .setFooter('have a popping day')
    channeltosend.send(helpembed);
    }
})
client.on('guildMemberAdd',member =>{
    const helpembed = new Discord.RichEmbed()
          .setColor(colour) 
          .setTitle('Welcome to **Cyber Quincy Bot Support**! Thank you for joining!')
          .setDescription(`Hi! I am Cyber Quincy, a bot made by hnngggrrrr#8734. for more information, type ${prefix}help`)
          .addField('if you are experiencing an error:','check with <#615159685477040135>, <#616603947481694209> or <#605712758595649566>.')
		  .addField('if you think that there is a bug:','go to <#598768319625035776> and please tell us what went wrong. If you have any questions on how to use this bot, go to <#611808489047719937>. if you have a suggestion, please let us know in <#598768278550085633>')
          .addField('general information:','[List of commands](https://docs.google.com/document/d/1NJqQ82EUP6yTri1MV63Pbk-l_Lo_WKXCndH7ED8retY/edit?usp=sharing)\n[support server](https://discord.gg/8agRm6c), join for updates and important uptimes and downtimes')
          .addField('Please note that this bot\'s name and avatar are owned by ninja Kiwi. This bot has no association with them.','have a popping day')
          .addField(`use ${prefix}info for more information`,'this bot was made by hnngggrrrr#8734')
    if(member.guild.id==='598768024761139240'){
        const tchannel = member.guild.channels.find(channel => channel.name.includes('welcome'))
        tchannel.send(`Welcome to the server, **${member.displayName}**. Please check the DM for more information, and read <#605712758595649566>. Thanks for joining, and you are our **${member.guild.memberCount}**th member!`)
  
        member.send(helpembed)
    }else if(member.guild.id==='543957081183617024'){
      const tchannel = member.guild.channels.find(channel => channel.name.includes('general'))
      tchannel.send(`welcome to the only rAcE sErVer`)
    }
})
client.on('guildMemberRemove',member =>{
    if(member.guild.id==='598768024761139240'){
        const tchannel = member.guild.channels.find(channel => channel.name.includes('welcome'))
        tchannel.send(`Goodbye, **${member.displayName}**`)
    }else if(member.guild.id==='543957081183617024'){
      const tchannel = member.guild.channels.find(channel => channel.name.includes('general'))
      tchannel.send(`${member.displayName} gave up on races and decided to watch sjb instead`)
    }
})
//messGAE
client.on('message',async message => {
    
    var noocmd= /noo+cmd/i
    //autohelp
    if (message.content.startsWith('29999')){
      message.channel.send('give nitro to him\n|\nv')
    }
    if(message.channel.id=='584133841313202176'||message.channel.id=='633848744017788948'){
      
	  if(message.content.includes('pants')||message.content.includes(':jeans:')){
		  if(message.content.includes('no')==true){
			  return message.channel.send('no PANTS')
		  }
	  	message.channel.send('PANTS PANTS PANTS')
	  }
    }
    
    
    if (!message.content.startsWith(prefix) || message.author.bot) return;
	  const args = message.content.slice(prefix.length).split(/ +/);
	  const commandName = args.shift().toLowerCase();
    if(commandName=='info'){
      const apiPing = Math.round(message.client.ping); 
      const responseTime = Math.round(Date.now() - message.createdTimestamp);
      let totalSeconds = (client.uptime / 1000);
      let days = Math.floor(totalSeconds / 86400);
      let hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      let minutes = Math.floor(totalSeconds / 60);
      let uptime = `${days} days, ${hours} hours, and ${minutes} minutes`;
      const infoEmbed = new Discord.RichEmbed()
	      .setColor('#23dbb6')
	      .setTitle('access help here')
	      .setURL('https://discord.gg/8agRm6c')
	      .setDescription(`Cyber Quincy is battling ${client.guilds.size} waves of bloons and training ${client.users.size} monkeys`)
	      .addField('ping:', `API ping ${apiPing}\nResponse time: ${responseTime}ms`,true)
        .setThumbnail('https://vignette.wikia.nocookie.net/b__/images/d/d3/QuincyCyberPortrait.png/revision/latest?cb=20190612021929&path-prefix=bloons')
	      .addField('time since last restart:', `${uptime}`, true)
	      .addField('version running',`${version}`)
        .addField('bot developer:','hnngggrrrr#8734', true)
        .addField('bot invite link','https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=805432400')
        .addField('commands list',' https://docs.google.com/document/d/1NJqQ82EUP6yTri1MV63Pbk-l_Lo_WKXCndH7ED8retY/edit?usp=sharing',true)
        .addField('support server, join for updates (happens pretty often)','https://discord.gg/8agRm6c',true)
        .setFooter('thank you for using it! waiting for NK\'s approval')
      message.channel.send(infoEmbed)
    }    
    if(commandName == 'hook'){
        if(message.author.id=='581686781569794048'||message.author.id=='231934333609312256'){
        hook(`${args[0]}`,`${args[1]}`)
        }
    }
	/*if(commandName=='edit'&&message.channel.id=='643773699916431361'){
		const h = require('./heroes.json')
		h['churchill'][args[0]].cost = args[1]*1.2
		h['ben'][args[0]].cost = args[1]
		fs.writeFile('./heroes.json',JSON.stringify(h),(err)=>{
            if(err)console.log(err)
        })
		
	}*/

	const command = client.commands.get(commandName)
		  || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	  if (!command) return;
      //cooldown
      if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
      }
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)&&noocmd.test(cont)===false) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    //command user
    if (noocmd.test(message.channel.topic)===false){
        try {
            command.execute(message, args);
            if(message.channel.type!='dm'){
                if(!xp[message.author.id]){
                    xp[message.author.id] = {
                        xp:0,
                        level: 1
                    }
                }
                let xpAdd = Math.floor(Math.random()*8)+5
                let curxp = xp[message.author.id].xp
                let curlvl = xp[message.author.id].level
                let nxtLvl = curlvl*300
                xp[message.author.id].xp = curxp+xpAdd
                if(nxtLvl <= xp[message.author.id].xp){
                    xp[message.author.id].level = curlvl+1
					let ran = Math.floor(Math.random()*8)
					switch(ran){
						case 0: var ltxt = 'Haha!'
						break;
						case 1: var ltxt = 'Ha!'
						break;
						case 2: var ltxt = 'Oh Yeah!'
						break;
						case 3: var ltxt = 'Alright!'
						break;
						case 4: var ltxt = 'Sweet!'
						break;
						case 5: var ltxt = 'Yes!'
						break;
						case 6: var ltxt = 'Nice!'
						break;
						case 7: var ltxt = 'Awesome!'
					}
                    message.channel.send(`${ltxt} ${message.author} levelled up!`)
                    if(xp[message.author.id].level==3){
                        let guildmember = message.member
                        guildmember.addRole('645126928340353036')
                    }
					if(xp[message.author.id].level==10){
                        let guildmember = message.member
                        guildmember.addRole('645629187322806272')
                    }
                }
                fs.writeFile('./xp.json',JSON.stringify(xp),(err)=>{
                    if(err)console.log(err)
                })
            }
        }
        catch (error) {
        console.error(error);
        const errorEmbed = new Discord.RichEmbed()
          .setColor(colour)
          .addField('something went wrong','Please join the [support server](https://discord.gg/8agRm6c)')
        message.reply(errorEmbed);
        }	
    }
});
keepAlive();
client.login(token);