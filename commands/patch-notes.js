const { green } = require('../jsons/colours.json');
module.exports = {
    name: 'update',
    aliases: ['patch'],
    execute(message) {
        const embed = new Discord.MessageEmbed()
            .setTitle('Patch notes')
            .setDescription(
                '[20.0](https://redd.it/ikvjo7/)\n[19.0](https://redd.it/hnsrp6/)\n[18.0](https://redd.it/gr6c4e/)\n[17.0](https://redd.it/fwth6g/)\n[16.0](https://redd.it/fa4mcx/)\n[15.0](https://redd.it/esyowc/)\n[14.0](https://redd.it/e9y1mo/)\n[13.0](https://redd.it/dm5tw0/)\n[12.0](https://redd.it/d5np4n/)\n[11.0](https://redd.it/c8h56t/)\n[10.0](https://redd.it/bc6rpe/)\n[9.0](https://redd.it/axbviz/)\n[8.0](https://redd.it/alkymt/)\n[7.0](https://redd.it/a5nme0/)\n[6.0](https://redd.it/9yaeeu/)\n[5.0](https://redd.it/9qkili/)\n[4.0](https://redd.it/9fc83u/)\n[3.0](https://redd.it/99inwj/)\n[2.0](https://redd.it/9125va/)\n[release](https://redd.it/8qxky3/)'
            )
            .setColor(green);
        message.channel.send(embed);
    },
};
