const GoogleSheetsHelper = require('../helpers/google-sheets.js');

module.exports = {
    name: 'race',
    aliases: ['rac', 'ra', 'racc', 'rae'],
    cooldown: 5,

    execute,

    dependencies: ['btd6index']
};

async function execute(message, args) {
    if (!args) {
        return await message.channel.send(
            'please specify a race number/name\nexamples:\nq!race 10\nq!race Primary Qualifiers'
        );
    }
    if (isNaN(args[0])) {
        let str = args.join(' ');
        return await findRaceByStr(str, message);
    } else if (isNaN(args[0]) || args[0] < 1)
        return await message.channel.send('please specify a valid race number');
    else {
        await findRaceByNum(parseInt(args[0]), message);
    }
}

async function findRaceByStr(str, message) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'Races');
    await sheet.loadCells('G3:G3'); // loads race #
    const raceCount = parseInt(sheet.getCellByA1('G3').value.slice(20));

    for (let i = 1; i <= raceCount; i++) {
        let rowToCheck = i * 3 + 9;
        await sheet.loadCells(`C${rowToCheck}:C${rowToCheck}`); // loads race name
        let raceName = sheet.getCellByA1(`C${rowToCheck}`).value.toLowerCase(); // race name
        if (str.includes(raceName) || raceName.includes(str)) {
            return findRaceByNum(i, message);
        }
    }
    return await message.channel.send(
        "Race isn't found. try a simpler phrase, you don't have to type the full name"
    );
}
async function findRaceByNum(number, message) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'Races');
    const row1 = number * 3 + 9;
    const row2 = number * 3 + 10;
    const row3 = number * 3 + 11;

    await sheet.loadCells(`B${row1}:Y${row3}`);

    //BRACE YOURSELVES

    const name = sheet.getCellByA1(`C${row1}`);
    const dates = sheet.getCellByA1(`E${row1}`);
    const info1 = sheet.getCellByA1(`G${row1}`);
    const info2 = sheet.getCellByA1(`G${row2}`);
    const info3 = sheet.getCellByA1(`G${row3}`);
    const firstPlaceNick = sheet.getCellByA1(`O${row1}`).value;
    const firstPlaceName = sheet.getCellByA1(`O${row2}`).value;
    const firstPlaceTime = sheet.getCellByA1(`O${row3}`);
    const secondPlaceNick = sheet.getCellByA1(`Q${row1}`).value;
    const secondPlaceName = sheet.getCellByA1(`Q${row2}`).value;
    const secondPlaceTime = sheet.getCellByA1(`Q${row3}`);
    const thirdPlaceNick = sheet.getCellByA1(`S${row1}`).value;
    const thirdPlaceName = sheet.getCellByA1(`S${row2}`).value;
    const thirdPlaceTime = sheet.getCellByA1(`S${row3}`);
    const fourthPlaceNick = sheet.getCellByA1(`U${row1}`).value;
    const fourthPlaceName = sheet.getCellByA1(`U${row2}`).value;
    const fourthPlaceTime = sheet.getCellByA1(`U${row3}`);
    const fifthPlaceNick = sheet.getCellByA1(`W${row1}`).value;
    const fifthPlaceName = sheet.getCellByA1(`W${row2}`).value;
    const fifthPlaceTime = sheet.getCellByA1(`W${row3}`);

    const players = sheet.getCellByA1(`Y${row1}`);

    const time = [
        firstPlaceTime.hyperlink,
        secondPlaceTime.hyperlink,
        thirdPlaceTime.hyperlink,
        fourthPlaceTime.hyperlink,
        fifthPlaceTime.hyperlink
    ];
    let output = '';
    for (i = 0; i < 5; i++) {
        hyperlink = time[i];
        if (!hyperlink) {
            hyperlink = 'none';
        }
        output += `${i + 1}:${hyperlink}\n`;
    }

    let RaceEmbed = new Discord.EmbedBuilder()
        .setTitle(`Race ${number}`)
        .setTitle(name.value.toString())
        .setDescription(`${info1.value}\n${info2.value}\n${info3.value}`)
        .addFields([
            { name: 'Date', value: `${dates.value}`, inline: true },
            { name: 'Links', value: `${output}`, inline: true },
            { name: 'Players', value: `${players.value}`, inline: true }
        ]);

    if (number == 143) RaceEmbed.addFields([{ name: 'Top 5', value: 'no' }]);
    else
        RaceEmbed.addFields([
            {
                name: 'Top 5',
                value: `${firstPlaceNick} ${firstPlaceName} ${firstPlaceTime.value}\n${secondPlaceNick} ${secondPlaceName} ${secondPlaceTime.value}\n${thirdPlaceNick} ${thirdPlaceName} ${thirdPlaceTime.value}\n${fourthPlaceNick} ${fourthPlaceName} ${fourthPlaceTime.value}\n${fifthPlaceNick} ${fifthPlaceName} ${fifthPlaceTime.value}`
            }
        ]);
    return await message.channel.send({ embeds: [RaceEmbed] });
}
