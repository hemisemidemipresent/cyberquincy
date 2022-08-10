const { cyber } = require('../jsons/colours.json');
const gHelper = require('../helpers/general.js');
const map = require('../jsons/map.json');
const OrParser = require('../parser/or-parser');
const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser');
const { discord } = require('../aliases/misc.json');

async function displayMapInfo(message, name) {
    let m = map[`${name}`];
    let thum = m.thu;
    if (!thum) {
        thum =
            'https://vignette.wikia.nocookie.net/b__/images/0/0c/QuincyCyberPortraitLvl20.png/revision/latest/scale-to-width-down/179?cb=20190612022025&path-prefix=bloons';
    }
    const mapEmbed = new Discord.EmbedBuilder()
        .setTitle('Map info')
        .setDescription(`Here is your info for ${name}`)
        .setThumbnail(`${thum}`)
        .addFields([
            { name: 'Map length(RBS)', value: `${m.lenStr}`, inline: true },
            { name: 'Object count:', value: `${m.obj}`, inline: true },
            { name: 'Total $ to clear out all the objects', value: `$${m.Cos}`, inline: true },
            { name: 'Version added:', value: `${m.ver}`, inline: true },
            { name: 'Water body percentage/Has water?', value: `${m['wa%']}`, inline: true },
            { name: 'Entrances/Exits', value: `${m.e}`, inline: true },
            { name: 'Bug reporting', value: `report [here](${discord})`, inline: true }
        ])
        //.addField('Line of sight obstructions', `${m.los}`, true)
        .setColor(cyber);
    await message.channel.send({ embeds: [mapEmbed] });
}

async function displayMapDifficultyRBS(message, mapDifficulty) {
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

    let infoEmbed = new Discord.EmbedBuilder()
        .setTitle(`${gHelper.toTitleCase(mapDifficulty)} Maps Info`)
        .setAuthor('Cyber Quincy')
        .setColor(cyber);

    mapToRbsSorted.forEach(([map, mapLength]) => {
        infoEmbed.addFields([{ name: Aliases.toIndexNormalForm(map), value: mapLength.toFixed(1) }]);
    });

    infoEmbed.setFooter({ text: 'average of all paths with no obstacles removed and no map mechanics' });

    return await message.channel.send({ embeds: [infoEmbed] });
}

async function helpMessage(message) {
    let helpEmbed = new Discord.EmbedBuilder()
        .setTitle('`q!map` HELP')
        .addFields([
            { name: '`q!map <map>`', value: 'Map Info' },
            { name: '`q!map <map_difficulty>`', value: 'RBSs (sorted) of all maps of the given map difficulty' }
        ])
        .setColor(cyber);

    return await message.channel.send({ embeds: [helpEmbed] });
}

async function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.EmbedBuilder()
        .setAuthor(`Sent by ${message.author.tag}`)

        .setTitle('ERROR')
        .addFields([{ name: 'Likely Cause(s)', value: parsingErrors.map((msg) => ` • ${msg}`).join('\n') }])
        .setColor(cyber);

    return await message.channel.send({ embeds: [errorEmbed] });
}

module.exports = {
    name: 'map',
    description: 'info about maps',
    aliases: ['m'],
    errorMessage,
    async execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return helpMessage(message);
        }
        let arr = [args[0]];
        const parsed = CommandParser.parse(arr, new OrParser(new MapParser(), new MapDifficultyParser()));
        if (parsed.hasErrors()) {
            return await errorMessage(message, parsed.parsingErrors);
        }
        if (parsed.map) {
            return await displayMapInfo(message, parsed.map);
        } else if (parsed.map_difficulty) {
            return await displayMapDifficultyRBS(message, parsed.map_difficulty);
        }
    }
};
