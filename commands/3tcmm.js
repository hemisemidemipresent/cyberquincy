const Discord = require('discord.js');
module.exports = {
    name: '3tcmm',
    execute(message, args, client) {
        async function access(n) {
            const { GoogleSpreadsheet } = require('google-spreadsheet');

            // spreadsheet key is the long id in the sheets URL
            const doc = new GoogleSpreadsheet(
                '1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA'
            );
            // load directly from json file if not in secure environment
            await doc.useServiceAccountAuth(require('../shh/config.json'));

            await doc.loadInfo(); // loads document properties and worksheets
            const sheet = doc.sheetsByIndex[3]; //load 3tcrbs spreadsheet
            await sheet.loadCells('L6:L7');
            const displacement = sheet.getCellByA1('L6').value;
            await sheet.loadCells(
                `C${n + displacement + 20}:O${n + displacement + 20}`
            ); // loads a range of cells
            const tower1 = sheet.getCellByA1(`C${n + displacement + 20}`);
            const tower2 = sheet.getCellByA1(`E${n + displacement + 20}`);
            const tower3 = sheet.getCellByA1(`G${n + displacement + 20}`);
            const upgrades = sheet.getCellByA1(`I${n + displacement + 20}`);
            const map = sheet.getCellByA1(`K${n + displacement + 20}`);
            const ver = sheet.getCellByA1(`M${n + displacement + 20}`);
            const date = sheet.getCellByA1(`N${n + displacement + 20}`);
            const person = sheet.getCellByA1(`O${n + displacement + 20}`);

            const challengeEmbed = new Discord.RichEmbed()
                .setTitle(`3tcmm combo #${n}`)
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
