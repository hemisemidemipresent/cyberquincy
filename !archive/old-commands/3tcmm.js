module.exports = {
    name: '3tcmm',
    execute(message, args) {
        async function access(n) {
            const { GoogleSpreadsheet } = require('google-spreadsheet');

            // spreadsheet key is the long id in the sheets URL
            const doc = new GoogleSpreadsheet('1-CK-uOK1rdCGjvQCYxaU9Fkwo_EsrX-CQp9vkewY50k');
            // load directly from json file if not in secure environment
            await doc.useServiceAccountAuth(require('../1/config.json'));

            await doc.loadInfo(); // loads document properties and worksheets
            const sheet = doc.sheetsByIndex[2]; //load 3tcrbs spreadsheet
            await sheet.loadCells(`C${n + 7}:O${n + 7}`); // loads a range of cells
            const tower1 = sheet.getCellByA1(`C${n + 7}`);
            const tower2 = sheet.getCellByA1(`E${n + 7}`);
            const tower3 = sheet.getCellByA1(`G${n + 7}`);
            const upgrades = sheet.getCellByA1(`I${n + 7}`);
            const map = sheet.getCellByA1(`K${n + 7}`);
            const ver = sheet.getCellByA1(`M${n + 7}`);
            const date = sheet.getCellByA1(`N${n + 7}`);
            const person = sheet.getCellByA1(`O${n + 7}`);

            const challengeEmbed = new Discord.EmbedBuilder()
                .setTitle(`3tcrbs combo #${n}`)
                .addField('tower 1', `${tower1.value}`, true)
                .addField('tower 2', `${tower2.value}`, true)
                .addField('tower 3', `${tower3.value}`, true)

                .addField('upgrades', `${upgrades.value}`, true)
                .addField('map', `${map.value}`, true)
                .addField('version', `${ver.value}`, true)
                .addField('date', `${date.value}`, true)
                .addField('person', `${person.value}`, true);
            message.channel.send({ embeds: [challengeEmbed] });
            if (isNaN(args[0])) return message.channel.send('Please specify a proper 2 towers chimps combo **number**');
        }
        access(parseInt(args[0]));
    }
};
