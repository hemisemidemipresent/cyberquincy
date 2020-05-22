const Discord = require('discord.js');
module.exports = {
    name: 'pts',
    cooldown: 60,
    execute(message, args, client) {
        function findPerson(array, person) {}
        async function access(name) {
            const { GoogleSpreadsheet } = require('google-spreadsheet');

            // spreadsheet key is the long id in the sheets URL
            const doc = new GoogleSpreadsheet(
                '1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA'
            );
            // load directly from json file if not in secure environment
            await doc.useServiceAccountAuth(require('../shh/config.json'));

            await doc.loadInfo(); // loads document properties and worksheets
            const sheet = doc.sheetsByIndex[16]; //load spreadsheet
            await sheet.loadCells('A2:B150');
            let pts = 0;
            let i = 2;
            let cell = sheet.getCellByA1(`A${i}`);
            let input = args.join(' ').toLowerCase();
            while (i < 150) {
                if (cell.value.includes(input)) {
                    pts = sheet.getCellByA1(`B${i}`).value;
                    break;
                }
                i++;
            }
            const embed = new Discord.MessageEmbed()
                .setDescription(`${input} has ${pts} pts`)
                .setImage(
                    'https://cdn.discordapp.com/attachments/615017143028809728/713220036806049822/Screenshot_580.png'
                );
            message.channel.send(embed);
        }
        access(args.join(' '));
    },
};
