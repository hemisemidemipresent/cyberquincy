const Discord = require('discord.js')
module.exports = {
    name: '2tc',
    execute (message, args) {
        async function access (n) {
            const { GoogleSpreadsheet } = require('google-spreadsheet')

            // spreadsheet key is the long id in the sheets URL
            const doc = new GoogleSpreadsheet(
                '1bK0rJzXrMqT8KuWufjwNrPxsYTsCQpAVhpBt20f1wpA'
            )
            // load directly from json file if not in secure environment
            await doc.useServiceAccountAuth(require('../1/config.json'))

            await doc.loadInfo() // loads document properties and worksheets
            const sheet = doc.sheetsByIndex[1] // load 2tc spreadsheet
            await sheet.loadCells(`C${n + 11}:M${n + 11}`) // loads a range of cells
            const tower1 = sheet.getCellByA1(`C${n + 11}`)
            const tower2 = sheet.getCellByA1(`E${n + 11}`)
            const upgrades = sheet.getCellByA1(`G${n + 11}`)
            const map = sheet.getCellByA1(`I${n + 11}`)
            const ver = sheet.getCellByA1(`K${n + 11}`)
            const date = sheet.getCellByA1(`L${n + 11}`)
            const person = sheet.getCellByA1(`M${n + 11}`)
            const challengeEmbed = new Discord.MessageEmbed()
                .setTitle(`2tc combo #${n}`)
                .addField('tower 1', `${tower1.value}`, true)
                .addField('tower 2', `${tower2.value}`, true)
                .addField('upgrades', `${upgrades.value}`, true)
                .addField('map', `${map.value}`, true)
                .addField('version', `${ver.value}`, true)
                .addField('date', `${date.value}`, true)
                .addField('person', `${person.value}`, true)
            message.channel.send(challengeEmbed)
            if (isNaN(args[0])) {
                return message.channel.send(
                    'Please specify a proper 2 towers chimps combo **number**'
                )
            }
        }
        access(parseInt(args[0]))
    }
}
