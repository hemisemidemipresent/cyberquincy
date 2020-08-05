const Discord = require('discord.js');
module.exports = {
    name: 'race',
    aliases: ['rac', 'ra', 'racc', 'rae'],
    cooldown: 5,
    execute(message, args, client) {
        if (isNaN(args[0]) || args[0] < 1)
            return message.channel.send('please specify a valid race number');
        async function access(n) {
            const { GoogleSpreadsheet } = require('google-spreadsheet');

            // spreadsheet key is the long id in the sheets URL
            const doc = new GoogleSpreadsheet(
                '1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA'
            );
            // load directly from json file if not in secure environment
            await doc.useServiceAccountAuth(require('../1/config.json'));

            await doc.loadInfo(); // loads document properties and worksheets
            const sheet = doc.sheetsByIndex[14]; //load 2tc spreadsheet
            await sheet.loadCells(`B${n * 3 + 9}:Y${n * 3 + 11}`); // loads a range of cells
            const name = sheet.getCellByA1(`C${n * 3 + 9}`);
            const dates = sheet.getCellByA1(`E${n * 3 + 9}`);
            const info1 = sheet.getCellByA1(`G${n * 3 + 9}`);
            const info2 = sheet.getCellByA1(`G${n * 3 + 10}`);
            const info3 = sheet.getCellByA1(`G${n * 3 + 11}`);
            const firstPlaceNick = sheet.getCellByA1(`O${n * 3 + 9}`);
            const firstPlaceName = sheet.getCellByA1(`O${n * 3 + 10}`);
            const firstPlaceTime = sheet.getCellByA1(`O${n * 3 + 11}`);
            const secondPlaceNick = sheet.getCellByA1(`Q${n * 3 + 9}`);
            const secondPlaceName = sheet.getCellByA1(`Q${n * 3 + 10}`);
            const secondPlaceTime = sheet.getCellByA1(`Q${n * 3 + 11}`);
            const thirdPlaceNick = sheet.getCellByA1(`S${n * 3 + 9}`);
            const thirdPlaceName = sheet.getCellByA1(`S${n * 3 + 10}`);
            const thirdPlaceTime = sheet.getCellByA1(`S${n * 3 + 11}`);
            const fourthPlaceNick = sheet.getCellByA1(`U${n * 3 + 9}`);
            const fourthPlaceName = sheet.getCellByA1(`U${n * 3 + 10}`);
            const fourthPlaceTime = sheet.getCellByA1(`U${n * 3 + 11}`);
            const fifthPlaceNick = sheet.getCellByA1(`W${n * 3 + 9}`);
            const fifthPlaceName = sheet.getCellByA1(`W${n * 3 + 10}`);
            const fifthPlaceTime = sheet.getCellByA1(`W${n * 3 + 11}`);
            const players = sheet.getCellByA1(`Y${n * 3 + 9}`);
            const RaceEmbed = new Discord.MessageEmbed()
                .setTitle(`Race ${n}`)
                .setTitle(name.value)
                .setDescription(
                    `${info1.value}\n${info2.value}\n${info3.value}`
                )
                .addField('Date', `${dates.value}`)
                .addField(
                    'Top 5',
                    `\`\`\`fix\n${firstPlaceNick.value} ${firstPlaceName.value} ${firstPlaceTime.value}\n\`\`\`\`\`\`diff\n- ${secondPlaceNick.value} ${secondPlaceName.value} ${secondPlaceTime.value}\n\`\`\`\`\`\`tex\n$ ${thirdPlaceNick.value} ${thirdPlaceName.value} ${thirdPlaceTime.value}\n\`\`\`\`\`\`\n${fourthPlaceNick.value} ${fourthPlaceName.value} ${fourthPlaceTime.value}\n\`\`\`\`\`\`\n${fifthPlaceNick.value} ${fifthPlaceName.value} ${fifthPlaceTime.value}\`\`\``
                )
                .addField('Players', `${players.value}`);

            message.channel.send(RaceEmbed);
            if (isNaN(args[0]))
                return message.channel.send(
                    'Please specify a proper 2 towers chimps combo **number**'
                );
        }
        access(parseInt(args[0]));
    },
};
