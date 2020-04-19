module.exports = {
    name: 'find3tcabr',
    execute(message, args, client) {
        function isEqual(a, b) {
            // if length is not equal
            if (a.length != b.length) return false;
            else {
                // comapring each element of array
                for (let i = 0; i < a.length; i++)
                    if (a[i] != b[i]) {
                        return false;
                    }
                return true;
            }
        }
        async function access(testArr) {
            const { GoogleSpreadsheet } = require('google-spreadsheet');
            const doc = new GoogleSpreadsheet(
                '1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA'
            );
            // load directly from json file
            await doc.useServiceAccountAuth(require('../shh/config.json'));
            await doc.loadInfo(); // loads document properties and worksheets
            const sheet = doc.sheetsByIndex[2]; //load 3tcrbs spreadsheet
            await sheet.loadCells(`L6:L7`);
            let numberOfCombos = sheet.getCellByA1('L6').value;
            let n = 1;
            while (n < numberOfCombos) {
                await sheet.loadCells(`C${n + 11}:G${n + 11}`); // loads a range of cells
                let tower1 = sheet.getCellByA1(`C${n + 11}`);
                let tower2 = sheet.getCellByA1(`E${n + 11}`);
                let tower3 = sheet.getCellByA1(`G${n + 11}`);
                let arr = [
                    tower1.value.toLowerCase(),
                    tower2.value.toLowerCase(),
                    tower3.value.toLowerCase(),
                ];
                arr.sort(); //sort array so if the are the same the order of the elements would be same
                testArr.sort();
                let isSame = isEqual(arr, testArr);
                if (isSame == true) {
                    return message.channel.send(
                        'Unfortunately, it looks like that combo has been done before!'
                    );
                } else {
                    n++;
                }
            }
            return message.channel.send(
                'that combo is probably unique! However that may be because you spelled a tower wrong! Do make sure you did everything correctly (**case doesnt matter*)'
            );
        }
        let towerArgs = args.join(' ');
        let towers = towerArgs.split(/, */);
        console.log(towers);
        access(towers);
    },
};
