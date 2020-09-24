module.exports = {
    name: 'merge',
    alias: ['combine'],
    rawargs: true,

    execute(message, args) {
        const merges = require('../jsons/merges.json');
        let tower1 = `${args[0]} ${args[1]}`;
        let tower2 = `${args[2]} ${args[3]}`;
        for (let i = 0; i < merges.length; i++) {
            let t1 = merges[i].tower1.toLowerCase();
            let t2 = merges[i].tower2.toLowerCase();

            if (t1 == tower1 && t2 == tower2) {
                message.channel.send(merges[i].link);
                break;
            }
        }
    },
};
