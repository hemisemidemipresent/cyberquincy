module.exports = {
    name: 'merge',
    alias: ['combine'],
    execute(message, args) {
        const merges = require('../jsons/merges.json');
        const newArgs = message.content.slice(2).split(/ +/);
        newArgs.shift();
        let tower1 = `${newArgs[0]} ${newArgs[1]}`;
        let tower2 = `${newArgs[2]} ${newArgs[3]}`;
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
