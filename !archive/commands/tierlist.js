const t = require('../jsons/tier.json');
module.exports = {
    name: 'tier',
    description: 'shows tier list',
    aliases: ['tl'],
    async execute(message, args) {
        if (!args[0]) {
            return await message.channel.send(
                `${
                    t.t.slice(-1)[0]
                }\nyou can see previous versions using q!tier <version>, for example q!tier 15.0`
            );
        }
        let v = parseInt(args[0]) - 11;
        if (!v) {
            return await module.exports.invalidVersion();
        }
        let cont = t.t[v];
        if (!cont) {
            return await module.exports.invalidVersion();
        }
        return await message.channel.send(`${cont}`);
    },
    async invalidVersion(message) {
        return await message.channel.send(
            'Please specify a proper version! not every version has a tier list! (12.0+ only)'
        );
    },
};
