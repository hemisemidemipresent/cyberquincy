const t = require('../jsons/tier.json');
module.exports = {
    name: 'tier',
    description: 'shows tier list',
    aliases: ['tl'],
    execute(message, args) {
        if (!args[0]) {
            return message.channel.send(
                `${
                    t.t.slice(-1)[0]
                }\nyou can see previous versions using q!tier <version>, for example q!tier 15.0`
            );
        }
        let v = parseInt(args[0]) - 11;
        if (!v) {
            return module.exports.invalidVersion();
        }
        let cont = t.t[v];
        if (!cont) {
            return module.exports.invalidVersion();
        }
        return message.channel.send(`${cont}`);
    },
    invalidVersion(message) {
        return message.channel.send(
            'Please specify a proper version! not every version has a tier list! (12.0+ only)'
        );
    },
};
