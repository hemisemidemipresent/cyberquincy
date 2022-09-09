const GoogleSheetsHelper = require('../helpers/google-sheets.js');
const { lightgreen, red } = require('../jsons/colors.json');
const { discord } = require('../aliases/misc.json');

const hardmodeodyssey =
    'https://vignette.wikia.nocookie.net/b__/images/f/f4/OdysseyModeHardBtn.png/revision/latest?cb=20200714061957&path-prefix=bloons';
module.exports = {
    name: 'odyssey',
    aliases: ['ody'],
    execute(message, args) {
        if (!args || args[1] || isNaN(args[0])) {
            module.exports.helpMessage(message.channel);
        }
        async function display(number) {
            const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'Odysseys');
            const row1 = number * 3 + 9;
            const row2 = number * 3 + 10;
            const row3 = number * 3 + 11;
            await sheet.loadCells(`C${row1}:V${row3}`);

            const name = sheet.getCellByA1(`C${row1}`).value;

            const restrictions = sheet.getCellByA1(`G${row1}`).value;

            const towers = sheet.getCellByA1(`G${row2}`).value;
            const heroes = sheet.getCellByA1(`G${row3}`).value;

            const map1 = [
                sheet.getCellByA1(`N${row1}`).value,
                sheet.getCellByA1(`N${row2}`).value,
                sheet.getCellByA1(`N${row3}`).value
            ];
            const map2 = [
                sheet.getCellByA1(`P${row1}`).value,
                sheet.getCellByA1(`P${row2}`).value,
                sheet.getCellByA1(`P${row3}`).value
            ];
            const map3 = [
                sheet.getCellByA1(`R${row1}`).value,
                sheet.getCellByA1(`R${row2}`).value,
                sheet.getCellByA1(`R${row3}`).value
            ];
            const map4 = [
                sheet.getCellByA1(`T${row1}`).value,
                sheet.getCellByA1(`T${row2}`).value,
                sheet.getCellByA1(`T${row3}`).value
            ];
            const map5 = [
                sheet.getCellByA1(`V${row1}`).value,
                sheet.getCellByA1(`V${row2}`).value,
                sheet.getCellByA1(`V${row3}`).value
            ];
            const date = sheet.getCellByA1(`E${row1}`).value;

            let embed = new Discord.EmbedBuilder()
                .setTitle(name)
                .setDescription(`${restrictions}\n${towers}\n${heroes}`)
                .addField('1st map', `${map1[0]}\n${map1[1]}\n${map1[2]}`)
                .addField('2nd map', `${map2[0]}\n${map2[1]}\n${map2[2]}`)
                .addField('3rd map', `${map3[0]}\n${map3[1]}\n${map3[2]}`)
                .addField('4th map', `${map4[0]}\n${map4[1]}\n${map4[2]}`)
                .addField('5th map', `${map5[0]}\n${map5[1]}\n${map5[2]}`)
                .setFooter(`Date: ${date}`)
                .setColor(lightgreen)
                .setThumbnail(hardmodeodyssey)
                .setFooter('Unfortunately we only have data for hard mode odysseys');
            message.channel.send({ embeds: [embed] });
        }
        try {
            display(parseInt(args[0]));
        } catch {
            errorMessage(message.channel);
        }
    },
    helpMessage(channel) {
        let embed = new Discord.EmbedBuilder()
            .setTitle('Odyssey info command')
            .addField('usage', 'q!odyssey <number>')
            .addField('example', '``q!odyssey 5 shows`` odyssey number 5')
            .setColor(red);
        channel.send({ embeds: [embed] });
    },
    errorMessage(channel) {
        let embed = new Discord.EmbedBuilder()
            .setTitle('Something went wrong!')
            .setDescription('Did you try inputting an invalid odyssey number? You probably did.')
            .addField('if this is an actual issue', `[report this bug](${discord})`);
        channel.send({ embeds: [embed] });
    }
};
