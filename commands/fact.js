const fact = require('../jsons/fact.json');
module.exports = {
    name: 'fact',
    description: 'random fact/lore from the NK blog. BIG credit to it',
    aliases: ['random', 'f'],
    usage: '[command name]',
    execute(message, args, client) {
        let randex;
        if (!args[0]) {
            randex = Math.floor(Math.random() * fact.length());
        } else {
            randex = parseInt(args[0]);
        }
        let fac = fact[randex];
        message.channel.send(`${fac}`);
    },
};
