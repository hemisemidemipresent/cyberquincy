module.exports = {
    statcord() {
        const Statcord = require('statcord.js');
        key = require('../1/config.json')['statcordkey'];

        global.statcord = new Statcord.Client({
            client,
            key: key,
            postCpuStatistics: false /* Whether to post memory statistics or not, defaults to true */,
            postMemStatistics: false /* Whether to post memory statistics or not, defaults to true */,
            postNetworkStatistics: false /* Whether to post memory statistics or not, defaults to true */,
        });
        statcord.on('autopost-start', () => {
            // Emitted when statcord autopost starts
            console.log('Started autopost');
        });

        statcord.on('post', (status) => {
            // status = false if the post was successful
            // status = "Error message" or status = Error if there was an error
            if (!status) console.log('Successful post');
            else console.error(status);
        });
    },
    post() {
        const fetch = require('node-fetch');
        const dblkey = (key = require('../1/config.json')['discordbotlist']);

        let users = client.users.cache.size;
        let guilds = client.guilds.cache.size;

        const body = {
            users: users,
            guilds: guilds,
        };
        fetch(
            `https://discordbotlist.com/api/v1/bots/591922988832653313/stats`,
            {
                method: 'post',
                body: JSON.stringify(body),
                headers: {
                    Authorization: dblkey,
                    'Content-Type': 'application/json',
                },
            }
        ).then((res) => res.json());
    },
    auto() {
        statcord.autopost();
    },
};
