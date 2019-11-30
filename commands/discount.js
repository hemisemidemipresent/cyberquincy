const Discord=require('discord.js')
module.exports ={
    name:"price",
    description:"tells you about price",
    execute(message,args){
        if(args[0].isNaN()==false){
            return message.channel.send('Please specify a number for cost. No dollar signs too.')
        }
        let cost = args[0]
        const costembed = new Discord.RichEmbed()
        .setTitle('Price calculator')
        .setDescription(`original price: ${cost}`)
        .addField('easy difficulty',cost*0.9)
        .addField('hard difficulty',cost*1.08)
        .addField('001 village',cost*0.9,true)
        .addField('002 village',cost*0.85,true)
        .addField('001 + 002 village',cost*0.9*0.85,true)
        .addField('2 001 villages',cost*0.9*0.9,true)
        .addField('2 002 villages',cost*0.85*0.85,true)
        .addField('3 001 villages',cost*0.9*0.9*0.9)
        .addField('2 001 villages + 002 villages',cost*0.9*0.9*0.85)
        .addField('001 village + 2 002 villages',cost*0.9*0.85*0.85)
        .addField('3 002 villages',cost*0.85*0.85*0.85)
        message.channel.send(costembed) 
    },
}