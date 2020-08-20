const GoogleSheetsHelper = require('../helpers/google-sheets.js');

module.exports = {
    BTD6_INDEX_KEY: '1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA',

    async load(key) {
        const { GoogleSpreadsheet } = require('google-spreadsheet');
    
        // spreadsheet key is the long id in the sheets URL
        const doc = new GoogleSpreadsheet(key);

        // load directly from json file if not in secure environment
        await doc.useServiceAccountAuth(require('../1/config.json'));

        await doc.loadInfo(); // loads document properties and worksheets

        console.log("{BTD6 Index loaded}");

        return doc;
    },

    sheetByName(doc, title) {
        // Filter sheets by the one that matches the given `title`
        const sheet = doc.sheetsByIndex.find(
            s => s.title.toLowerCase() === title.toLowerCase()
        );
        
        if (sheet) {
            return sheet
        } else {
            throw `Spreadsheet ${doc.title} doesn't have a tab titled "${title}"`;
        }
    }
}