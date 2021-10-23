module.exports = {
    name: 'health',
    aliases: ['h', 'hp'],
    description: 'calculates the health of blimps, even in freeplay',
    usages: ['q!health <blimp> <round>'],
    execute(message, args) {
        //<WARNING!!!>
        //THIS CODE IS A MESS

        if (!args[1] || isNaN(args[1])) {
            return message.channel.send(
                'the command is q!health <blimp> <round>'
            );
        }
        let bloonName = args[0];
        let round = args[1];

        let baseHealth;
        if (bloonName === 'moab') {
            baseHealth = 200;
        } else if (bloonName === 'bfb') {
            baseHealth = 700;
        } else if (bloonName === 'zomg') {
            baseHealth = 4000;
        } else if (bloonName === 'ddt') {
            baseHealth = 400;
        } else if (bloonName === 'bad') {
            baseHealth = 20000;
        } else {
            return message.channel.send('please specify a blimp, e.g. ZOMG');
        }
        //percentage increase

        let bhealth = Math.floor(baseHealth * (1 + b.getRamping(round) / 100));

        if (round > 80) {
            return message.channel.send(
                `${bhealth} pops are needed to pop this blimp (not including children)`
            );
        } else if (round < 1) {
            return message.channel.send(
                'quincy has no experience in these rounds'
            );
        } else if (round > 0 && round < 81) {
            return message.channel.send(`${baseHealth}`);
        }
    },
};
