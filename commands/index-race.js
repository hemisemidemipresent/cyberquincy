const GoogleSheetsHelper = require('../helpers/google-sheets.js');

module.exports = {
    name: 'race',
    aliases: ['rac', 'ra', 'racc', 'rae'],
    cooldown: 5,

    execute,

    dependencies: ['btd6index'],
};

function execute(message, args) {
    if (!args) {
        return message.channel.send(
            'please specify a race number/name\nexamples:\nq!race 10\nq!race Primary Qualifiers'
        );
    }
    if (isNaN(args[0])) {
        let str = args.join(' ');
        return findRaceByStr(str, message);
    } else if (isNaN(args[0]) || args[0] < 1)
        return message.channel.send('please specify a valid race number');
    else {
        findRaceByNum(parseInt(args[0]), message);
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
    return message.channel.send(
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
    const firstPlaceTime = sheet.getCellByA1(`O${row3}`).value;
    const secondPlaceNick = sheet.getCellByA1(`Q${row1}`).value;
    const secondPlaceName = sheet.getCellByA1(`Q${row2}`).value;
    const secondPlaceTime = sheet.getCellByA1(`Q${row3}`).value;
    const thirdPlaceNick = sheet.getCellByA1(`S${row1}`).value;
    const thirdPlaceName = sheet.getCellByA1(`S${row2}`).value;
    const thirdPlaceTime = sheet.getCellByA1(`S${row3}`).value;
    const fourthPlaceNick = sheet.getCellByA1(`U${row1}`).value;
    const fourthPlaceName = sheet.getCellByA1(`U${row2}`).value;
    const fourthPlaceTime = sheet.getCellByA1(`U${row3}`).value;
    const fifthPlaceNick = sheet.getCellByA1(`W${row1}`).value;
    const fifthPlaceName = sheet.getCellByA1(`W${row2}`).value;
    const fifthPlaceTime = sheet.getCellByA1(`W${row3}`).value;
    let times = [
        firstPlaceNick,
        firstPlaceName,
        firstPlaceTime,
        secondPlaceNick,
        secondPlaceName,
        secondPlaceTime,
        thirdPlaceNick,
        thirdPlaceName,
        thirdPlaceTime,
        fourthPlaceNick,
        fourthPlaceName,
        fourthPlaceTime,
        fifthPlaceNick,
        fifthPlaceName,
        fifthPlaceTime,
    ];
    const players = sheet.getCellByA1(`Y${row1}`);

    const time = [
        firstPlaceTime.hyperlink,
        secondPlaceTime.hyperlink,
        thirdPlaceTime.hyperlink,
        fourthPlaceTime.hyperlink,
        fifthPlaceTime.hyperlink,
    ];
    let output = '';
    for (i = 0; i < 5; i++) {
        hyperlink = time[i];
        if (!hyperlink) {
            hyperlink = 'none';
        }
        output += `${i + 1}:${hyperlink} `;
    }
    let timeOutput = '';

    const RaceEmbed = new Discord.MessageEmbed()
        .setTitle(`Race ${number}`)
        .setTitle(name.value)
        .setDescription(`${info1.value}\n${info2.value}\n${info3.value}`)
        .addField('Date', `${dates.value}`)
        .addField(
            'Top 5',
            `\`\`\`fix\n${firstPlaceNick.value} ${firstPlaceName.value} ${firstPlaceTime.value}\n\`\`\`\`\`\`diff\n- ${secondPlaceNick.value} ${secondPlaceName.value} ${secondPlaceTime.value}\n\`\`\`\`\`\`tex\n$ ${thirdPlaceNick.value} ${thirdPlaceName.value} ${thirdPlaceTime.value}\n\`\`\`\`\`\`\n${fourthPlaceNick.value} ${fourthPlaceName.value} ${fourthPlaceTime.value}\n\`\`\`\`\`\`\n${fifthPlaceNick.value} ${fifthPlaceName.value} ${fifthPlaceTime.value}\`\`\``
        )
        .addField('Links', `${output}`)
        .addField('Players', `${players.value}`);

    return message.channel.send(RaceEmbed);
}
