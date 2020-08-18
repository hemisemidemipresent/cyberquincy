const MapParser = require('../parser/map-parser.js');
const GoogleSheetsHelper = require('../helpers/google-sheets.js');

MIN_ROW = 1,
MAX_ROW = 100,

COLS = {
    MAP: 'B',
    COST: 'D',
    VERSION: 'E',
    DATE: 'F',
    PERSON: 'G',
    LINK: 'I',
    CURRENT: 'J',
}


module.exports = {
    name: 'lcc',

    aliases: ['leastcash', 'lcash'],

    execute(message, args) {
        try{
            var btd6_map = CommandParser.parse(
                args,
                new MapParser()
            ).map;
        } catch(e) {
            if (e instanceof ParsingError) {
                return module.exports.errorMessage(message, e)
            } else {
                throw e;
            }
        }

        async function displayLCC(btd6_map) {
            doc = await GoogleSheetsHelper.load(GoogleSheetsHelper.BTD6_INDEX_KEY);
            
            const sheet = GoogleSheetsHelper.sheetByName(doc, 'lcc');

            await sheet.loadCells(`${COLS.MAP}${MIN_ROW}:${COLS.MAP}${MAX_ROW}`); // loads all possible cells with map
    
            var entryRow = null;
    
            for (var row = 1; row <= MAX_ROW; row++) {
                var mapCandidate = sheet.getCellByA1(`${COLS.MAP}${row}`).value;
                if (mapCandidate && mapCandidate.toLowerCase().replace(" ", "_") === btd6_map) {
                    entryRow = row;
                    break;
                }
            }
    
            await sheet.loadCells(`${COLS.MAP}${entryRow}:${COLS.CURRENT}${entryRow}`);

            values = {}
            for (key in COLS) {
                values[key] = sheet.getCellByA1(`${COLS[key]}${entryRow}`).value
            }
    
            // Special formatting for date
            dateCell = sheet.getCellByA1(`${COLS.DATE}${entryRow}`);
            values.DATE = dateCell.formattedValue;
    
            // Special formattin for cost
            values.COST = '$' + h.numberWithCommas(values.COST)
    
            // Special handling for link
            linkCell = sheet.getCellByA1(`${COLS.LINK}${entryRow}`);
            values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`
    
            var challengeEmbed = new Discord.MessageEmbed()
                .setTitle(`${values.MAP} LCC Combo`)
                .setColor(colours['cyber']);
            
            for (field in values) {
                challengeEmbed = challengeEmbed.addField(h.toTitleCase(field), values[field], true)
            }
    
            message.channel.send(challengeEmbed);
        }
        
        displayLCC(btd6_map);
    },

    errorMessage(message, parsingError) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Likely Cause(s)', parsingError.parsingErrors.join('\n'))
            .addField('Type `q!lcc` for help', ':)')
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};
