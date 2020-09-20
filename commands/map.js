const { cyber } = require('../jsons/colours.json');
const map = require('../jsons/map.json');
const MapParser = require('../parser/map-parser.js');

module.exports = {
    name: 'map',
    description: 'info about maps',
    aliases: ['m'],
    execute(message, args) {
        let arr = [args[0]];
        const parsed = CommandParser.parse(arr, new MapParser());
        let name = parsed.map;
        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }
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
            .addField('Entrances/Exits', `${m.e.e}`, true)
            //.addField('Line of sight obstructions', `${m.los}`, true)
            .addField(
                'Bug reporting',
                'report [here](https://discord.gg/VMX5hZA)',
                true
            )
            .setFooter(
                'I am Quincy, Evolved from quincy.',
                'https://vignette.wikia.nocookie.net/b__/images/0/0c/QuincyCyberPortraitLvl20.png/revision/latest/scale-to-width-down/179?cb=20190612022025&path-prefix=bloons'
            )
            .setColor(cyber);
        message.channel.send(mapEmbed);
    },
    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .setColor(cyber);

        return message.channel.send(errorEmbed);
    },
};
