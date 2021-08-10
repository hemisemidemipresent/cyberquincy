const { cyber } = require('../jsons/colours.json');
const gHelper = require('../helpers/general.js');
const map = require('../jsons/map.json');
const OrParser = require('../parser/or-parser');
const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser');
const { discord } = require('../aliases/misc.json');

function displayMapInfo(message, name) {
    let m = map[`${name}`];
    let thum = m.thu;
    if (!thum) {
        thum =
            'https://vignette.wikia.nocookie.net/b__/images/0/0c/QuincyCyberPortraitLvl20.png/revision/latest/scale-to-width-down/179?cb=20190612022025&path-prefix=bloons';
    }
    const mapEmbed = new Discord.MessageEmbed()
        .setTitle('Map info')
        .setDescription(`Here is your info for ${name}`)
        .setThumbnail(`${thum}`)
        .addField('Map length(RBS)', `${m.lenStr}`, true)
        .addField('Object count:', `${m.obj}`, true)
        .addField('Total $ to clear out all the objects', `$${m.Cos}`, true)
        .addField('Version added:', `${m.ver}`, true)
        .addField('Water body percentage/Has water?', `${m['wa%']}`, true)
        .addField('Entrances/Exits', `${m.e}`, true)
        //.addField('Line of sight obstructions', `${m.los}`, true)
        .addField('Bug reporting', `report [here](${discord})`, true)
        .setColor(cyber);
    message.channel.send(mapEmbed);
}

function displayMapDifficultyRBS(message, mapDifficulty) {
    const maps = Aliases.allMapsFromMapDifficulty(mapDifficulty);
    const mapsLengths = maps.map((m) => {
        // Get all 1 or more path lengths into a flat array
        const mapLengths = [map[m].len].flat();
        // Return the average of the path lengths
        return mapLengths.reduce((a, b) => a + b, 0) / mapLengths.length;
    });

    mapToRbsSorted = gHelper.zip([maps, mapsLengths]).sort(function (a, b) {
        return b[1] - a[1];
    });

    let infoEmbed = new Discord.MessageEmbed()
        .setTitle(`${gHelper.toTitleCase(mapDifficulty)} Maps Info`)
        .setAuthor('Cyber Quincy')
        .setColor(cyber);

    mapToRbsSorted.forEach(([map, mapLength]) => {
        infoEmbed.addField(
            Aliases.toIndexNormalForm(map),
            mapLength.toFixed(1)
        );
    });

    infoEmbed.setFooter(
        'average of all paths with no obstacles removed and no map mechanics'
    );

    return message.channel.send(infoEmbed);
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!map` HELP')
        .addField('`q!map <map>`', 'Map Info')
        .addField(
            '`q!map <map_difficulty>`',
            'RBSs (sorted) of all maps of the given map difficulty'
        )
        .setColor(cyber);

    return message.channel.send({ embeds: [helpEmbed] });
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setAuthor(`Sent by ${message.author.tag}`)

        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .setColor(cyber);

    return message.channel.send({ embeds: [errorEmbed] });
}

module.exports = {
    name: 'map',
    description: 'info about maps',
    aliases: ['m'],
    errorMessage,
    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return helpMessage(message);
        }
        let arr = [args[0]];
        const parsed = CommandParser.parse(
            arr,
            new OrParser(new MapParser(), new MapDifficultyParser())
        );
        if (parsed.hasErrors()) {
            return errorMessage(message, parsed.parsingErrors);
        }
        if (parsed.map) {
            return displayMapInfo(message, parsed.map);
        } else if (parsed.map_difficulty) {
            return displayMapDifficultyRBS(message, parsed.map_difficulty);
        }
    },
};
