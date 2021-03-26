const { cyber } = require('../jsons/colours.json');
const map = require('../jsons/map.json');
const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser');
const { discord } = require('../aliases/misc.json');

function displayMapInfo(name) {
    let m = map[`${name}`];
    let thum = m.thu;
    if (!thum) {
        thum =
            'https://vignette.wikia.nocookie.net/b__/images/0/0c/QuincyCyberPortraitLvl20.png/revision/latest/scale-to-width-down/179?cb=20190612022025&path-prefix=bloons';
    }
    const mapEmbed = new Discord.MessageEmbed()
        //.setColor(cyber)
        .setTitle('Map info')
        .setAuthor('Cyber Quincy')
        .setDescription(`Here is your info for ${name}`)
        .setThumbnail(`${thum}`)
        .addField('Map length(RBS)', `${m.len}`, true)
        .addField('Object count:', `${m.obj}`, true)
        .addField('Total $ to clear out all the objects', `$${m.Cos}`, true)
        .addField('Version added:', `${m.ver}`, true)
        .addField('Water body percentage', `${m['wa%']}`, true)
        .addField('Entrances/Exits', `${m.e}`, true)
        //.addField('Line of sight obstructions', `${m.los}`, true)
        .addField('Bug reporting', `report [here](${discord})`, true)
        .setFooter(
            'I am Quincy, Evolved from quincy.',
            'https://vignette.wikia.nocookie.net/b__/images/0/0c/QuincyCyberPortraitLvl20.png/revision/latest/scale-to-width-down/179?cb=20190612022025&path-prefix=bloons'
        )
        .setColor(cyber);
    message.channel.send(mapEmbed);
}

function displayMapDifficultyRBS(mapDifficulty) {
    const maps = Aliases.allMapsFromMapDifficulty(mapDifficulty);
    
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .setColor(cyber);

    return message.channel.send(errorEmbed);
}

module.exports = {
    name: 'map',
    description: 'info about maps',
    aliases: ['m'],
    errorMessage,
    execute(message, args) {
        let arr = [args[0]];
        const parsed = CommandParser.parse(
            arr, 
            new OrParser(
                new MapParser(),
                new MapDifficultyParser(),
            )
        );
        if (parsed.hasErrors()) {
            return errorMessage(message, parsed.parsingErrors);
        }
        if(parsed.map) {
            return displayMapInfo(parsed.map);
        } else if(parsed.map_difficulty) {
            return displayMapDifficultyRBS(parsed.map_difficulty);
        }
    },
};
