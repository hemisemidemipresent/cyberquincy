const Discord = require('discord.js');
module.exports = {
    name: '3tcabr',
    execute(message, args) {
        async function access(n) {
            const sheet = Btd6Index.sheetsByIndex[2]; //load 3tcrbs spreadsheet
            await sheet.loadCells(`C${n + 11}:O${n + 11}`); // loads a range of cells
            const tower1 = sheet.getCellByA1(`C${n + 11}`);
            const tower2 = sheet.getCellByA1(`E${n + 11}`);
            const tower3 = sheet.getCellByA1(`G${n + 11}`);
            const upgrades = sheet.getCellByA1(`I${n + 11}`);
            const map = sheet.getCellByA1(`K${n + 11}`);
            const ver = sheet.getCellByA1(`M${n + 11}`);
            const date = sheet.getCellByA1(`N${n + 11}`);
            const person = sheet.getCellByA1(`O${n + 11}`);

            const challengeEmbed = new Discord.MessageEmbed()
                .setTitle(`3tcabr combo #${n}`)
                .addField('tower 1', `${tower1.value}`, true)
                .addField('tower 2', `${tower2.value}`, true)
                .addField('tower 3', `${tower3.value}`, true)

                .addField('upgrades', `${upgrades.value}`, true)
                .addField('map', `${map.value}`, true)
                .addField('version', `${ver.value}`, true)
                .addField('date', `${date.value}`, true)
                .addField('person', `${person.value}`, true);
            message.channel.send(challengeEmbed);
            if (isNaN(args[0]))
                return message.channel.send(
                    'Please specify a proper 2 towers chimps combo **number**'
                );
        }
        access(parseInt(args[0]));
    },
};
