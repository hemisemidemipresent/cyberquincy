const r1 = require('../rounds.json')
const round2 = require('../round2.json')
const Discord = require('discord.js')
module.exports = {
    name: 'round',
    description:'tells you about the rounds (below 100)',
    aliases:['r'],
    execute(message,args){
      if(args[0]==undefined||args[0]=='help'){
        return message.channel.send('!round <round number>', { code: "md" })
      }
        var round = parseInt(args[0])
        const r = round2[round-1]
        if (round>0&&round<21){
            var xp = 20*round+20
            var weirdround = round-1
            var totalxp = 40+50*weirdround+10*Math.pow(weirdround,2)
        }else if (round>20&&round<51){
            var round20 = round - 20
            var xp = 40*round20+420
            var totalxp = 4600+440*round20+20*Math.pow(round20,2)
        }else if (round>50&&round<101){
            var round50 = round-50
            var xp = round50*90+1620
            var totalxp = 35800+1665*round50+45*Math.pow(round50,2)
        }else if(round==200){
          return message.channel.send('2 fortified BADs')
        }else if (round<1){
          return message.channel.send('Quincy has no experience in these rounds')
        }
        else if (round>100){
            return message.channel.send('HEY! All rounds from 100 above are all random!')
        }else{
          return message.channel.send('please specify a **number**')
        }
        const index = parseInt(args[0])
        var data = r1[`r${index}`]
		const roundembed = new Discord.RichEmbed()
		.setTitle(`round ${round}`)
		.setDescription(`${data}`)
		.addField('xp earned in that round',`${xp}`)
		.addField('total xp if you started at round 1',`${totalxp}`)
		.addField('**if:**','you are not in freeplay (then divide xp by 10 for value) AND\n2) you are playing beginner maps (intermediate +10%, advanced +20%, expert +30%)')
		.setFooter('for more data use q!income')
        message.channel.send(roundembed)
    }
}