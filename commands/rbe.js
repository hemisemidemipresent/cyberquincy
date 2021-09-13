const r = require('../jsons/round2.json');
const { red, magenta } = require('../jsons/colours.json');
const OrParser = require('../parser/or-parser');
const RoundParser = require('../parser/round-parser');
const EmptyParser = require('../parser/empty-parser');
module.exports = {
    name: 'pop',
    aliases: ['rbe', 'popcount', 'pops'],
    async execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new RoundParser('ALL'),
            new OrParser(new RoundParser('ALL'), new EmptyParser())
        );
        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }
        let rounds = parsed.rounds.sort((a, b) => a - b);
        const startround = rounds[0];
        if (rounds.length == 1) {
            return module.exports.oneRound(startround, message.channel);
        }
        let endround = rounds[1];
        return module.exports.showData(startround, endround, message.channel);
    },
    async errorMessage(message, errors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle(`${errors.join('\n')}`)
            .addField(
                'find the cash from round X to round Y',
                '**q!income <startround> <endround>**'
            )
            .addField(
                'other difficulties',
                '**q!income <startround> <endround> <difficulty>**\n(<difficulty> includes deflation, half cash, abr, apop is random)'
            )
            .setColor(red);
        return await message.channel.send({ embeds: [errorEmbed] });
    },
    async oneRound(startround, channel) {
        return await channel.send(
            `Round ${startround} has a rbe(pop count) of ${r[startround].rbe}`
        );
    },
    async showData(startround, endround, channel) {
        let totalpopcount =
            r[endround].cumulativeRBE - r[startround - 1].cumulativeRBE;
        const dataEmbed = new Discord.MessageEmbed()
            .setTitle(`<:PopIcon:755016023333404743>${totalpopcount}`)
            .setDescription(`from round ${startround} to ${endround}`)
            .setFooter('note: towers may count pops differently due to bugs')
            .setColor(magenta);
        await channel.send({ embeds: [dataEmbed] });
    },
};
