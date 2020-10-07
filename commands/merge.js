module.exports = {
    name: 'merge',
    alias: ['combine'],
    rawargs: true,

    execute(message, args) {
        const merges = require('../jsons/merges.json');
        let tower1 = `${args[0]} ${args[1]}`;
        let tower2;
        if (!args[3]) tower2 = `${args[2]}`;
        else tower2 = `${args[2]} ${args[3]}`;
        let res;
        for (let i = 0; i < merges.length; i++) {
            let t1 = merges[i].tower1.toLowerCase();
            let t2 = merges[i].tower2.toLowerCase();

            if (t1 == tower1 && t2 == tower2) {
                res = merges[i].link;
                break;
            }
        }
        if (!res) {
            return message.channel.send(
                'example: q!merge t dart m dart\norder: t path before m path before b path\ntower order/names: dart, boomer, bomb, tack, glue, sniper, sub, boat, ace, heli, mortar, wiz, super, ninja, alch, druid, village, farm, spact, engi\nhero names: quincy, gwen, striker, obyn, churchill, ben, ezili, pat, adora, brickell, etienne'
            );
        }
        return message.channel.send(res);
    },
};
