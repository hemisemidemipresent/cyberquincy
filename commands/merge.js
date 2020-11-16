module.exports = {
    name: 'merge',
    alias: ['combine'],
    rawArgs: true,

    async execute(message, args) {
        const { GoogleSpreadsheet } = require('google-spreadsheet');

        // spreadsheet key is the long id in the sheets URL
        const doc = new GoogleSpreadsheet(
            '12JUuBijnLNsD_rWh28CFlEQDlOErqZBOYkiBXlhzUY4'
        );

        // load directly from json file if not in secure environment
        await doc.useServiceAccountAuth(require('../1/config.json'));

        await doc.loadInfo(); // loads document properties and worksheets
        console.log(doc.title);

        let sheet = doc.sheetsByIndex[0];
        await sheet.loadCells('D3:D3');
        let cell = sheet.getCellByA1('D3');
        console.log(cell);
    },
};
