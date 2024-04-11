const BTD6_INDEX_KEY = '16of-RFUD1FteVchU9S4vAht39nlh1iraeoNA4u3R9cw';

async function load(key) {
    const { GoogleSpreadsheet } = require('google-spreadsheet');

    // spreadsheet key is the long id in the sheets URL
    const doc = new GoogleSpreadsheet(key);

    // load directly from json file if not in secure environment
    await doc.useServiceAccountAuth(require('../1/config.json'));

    await doc.loadInfo(); // loads document properties and worksheets

    return doc;
}

function sheetByName(doc, title) {
    // Filter sheets by the one that matches the given `title`
    const sheet = doc.sheetsByIndex.find((s) => s.title.toLowerCase() === title.toLowerCase());

    if (sheet) {
        return sheet;
    } else {
        throw `Spreadsheet ${doc.title} doesn't have a tab titled "${title}"`;
    }
}

function rowColToA1(row, col) {
    return `${getA1ColumnName(col)}${row}`;
}

function getA1ColumnName(col) {
    dividend = col;
    columnName = '';

    while (dividend > 0) {
        modulo = (dividend - 1) % 26;
        columnName = String.fromCharCode(65 + modulo) + columnName;
        dividend = Math.floor((dividend - modulo) / 26);
    }

    return columnName;
}

function getColumnIndexFromLetter(letter) {
    let base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 0;

    for (let i = 0, j = letter.length - 1; i < letter.length; i += 1, j -= 1) {
        result += Math.pow(base.length, j) * (base.indexOf(letter[i]) + 1);
    }

    return result - 1;
}

module.exports = {
    BTD6_INDEX_KEY,

    load,
    sheetByName,
    rowColToA1,
    getColumnIndexFromLetter
};
