const Minesweeper = require('discord.js-minesweeper');
const Discord = require('discord.js');
const { green } = require('../jsons/colours.json');
module.exports = {
    name: 'minesweeper',
    aliases: ['mine', 'ms', 'sweeper'],

    execute(message, args) {
        let minesweeper = new Minesweeper({
            rows: 5,
            columns: 10,
            mines: 10,
            revealFirstCell: true,
        });

        let str = minesweeper.start();
        console.log(str);
        let res = str
            .replace(/ :zero: /g, '<:PopIcon:755016023333404743>')
            .replace(/ :one: /g, '<:Red:782880667398307850>')
            .replace(/ :two: /g, '<:Blue:782880760037638176>')
            .replace(/ :three: /g, '<:Green:782883537560403968>')
            .replace(/ :four: /g, '<:Yellow:782883590995312650>')
            .replace(/ :five: /g, '<:Pink:782883623372062731>')
            .replace(/ :six: /g, '<:Purple:782896535373348886>')
            .replace(/ :boom: /g, '<:MoabMine:782889797818908713>');

        let embed = new Discord.MessageEmbed()
            .setDescription(res)
            .addField(
                'legend',
                '<:PopIcon:755016023333404743> - 0\n<:Red:782880667398307850> - 1\n<:Blue:782880760037638176> - 2\n<:Green:782883537560403968> - 3\n.\n.\n.\n<:Purple:782896535373348886> - 6\n<:MoabMine:782889797818908713> - game over'
            )

            .setColor(green);
        message.channel.send(embed);
    },
};
