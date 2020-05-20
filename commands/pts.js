const Discord = require('discord.js');
module.exports = {
    name: 'pts',
    cooldown: 60,
    execute(message, args, client) {
        function findPerson(array, person) {
            let count = 0;
            for (i = 0; i < array.length; i++) {
                if (
                    array[i] &&
                    array[i].toLowerCase().includes(person.toLowerCase())
                ) {
                    count++;
                }
            }
            return count;
        }
        async function access(name) {
            const { GoogleSpreadsheet } = require('google-spreadsheet');

            // spreadsheet key is the long id in the sheets URL
            const doc = new GoogleSpreadsheet(
                '1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA'
            );
            // load directly from json file if not in secure environment
            await doc.useServiceAccountAuth(require('../shh/config.json'));

            await doc.loadInfo(); // loads document properties and worksheets
            let points = 0; // this is the TOTAL points
            // 2TC point calc
            const sheet2tc = doc.sheetsByIndex[1]; //load 2tc spreadsheet
            await sheet2tc.loadCells('J6:J6'); // this is the number of 2tc combos
            const num2tc = sheet2tc.getCellByA1(`J6`);

            await sheet2tc.loadCells(`M12:M${num2tc.value + 11}`); // this is the column of names
            let array2tc = [];
            let temp = '';
            for (i = 1; i <= num2tc.value; i++) {
                // creates an array of all the names
                temp = sheet2tc.getCellByA1(`M${11 + i}`);
                array2tc.push(temp.value);
            }
            let points2tc = findPerson(array2tc, name) * 80;
            points += points2tc; // adds points

            // 3TCABR
            const sheet3tcabr = doc.sheetsByIndex[2]; //load spreadsheet

            await sheet3tcabr.loadCells('L6:L6'); // this is the number of  combos
            const num3tc = sheet3tcabr.getCellByA1(`L6`);

            await sheet3tcabr.loadCells(`O12:O${num3tc.value + 11}`); // this is the column of names
            let array3tcabr = [];
            for (i = 1; i <= num3tc.value; i++) {
                // creates an array of all the names
                temp = sheet3tcabr.getCellByA1(`O${11 + i}`);
                array3tcabr.push(temp.value);
            }
            let points3tc = findPerson(array3tcabr, name) * 40;
            points += points3tc; // adds points

            // LCC
            const sheetlcc = doc.sheetsByIndex[3]; //load spreadsheet
            await sheetlcc.loadCells('G12:G67'); // this is the column of names
            let arraylcc = [];
            for (i = 0; i < 55; i++) {
                // creates an array of all the names
                temp = sheetlcc.getCellByA1(`G${12 + i}`);
                arraylcc.push(temp.value);
            }
            let pointslcc = findPerson(arraylcc, name) * 50;
            points += pointslcc; // adds points
            // 2mpc
            const sheet2mpc = doc.sheetsByIndex[5]; //load spreadsheet
            await sheet2mpc.loadCells('J12:J80'); // this is the column of names
            let array2mpc = [];
            for (i = 0; i < 55; i++) {
                // creates an array of all the names
                temp = sheet2mpc.getCellByA1(`J${12 + i}`);
                array2mpc.push(temp.value);
            }
            let points2mpc = findPerson(array2mpc, name) * 50;
            points += points2mpc; // adds points
            // make the embed
            temp = new Discord.MessageEmbed()
                .setDescription(
                    `**Not counting LTC, alt maps**\n${name} has ${points} pts`
                )
                .addField('2tc', points2tc)
                .addField('3tc', points3tc)
                .addField('lcc', pointslcc)
                .addField('2mpc', points2mpc)
                .setFooter(
                    'BTD6 Index is less for data scraping and more for viewing experience. Plus I am not using their messy direct API this will slow the response to 30seconds, and by then it will be so slow that most people gave up.'
                );
            message.channel.send(temp);
        }
        access(args.join(' '));
    },
};
