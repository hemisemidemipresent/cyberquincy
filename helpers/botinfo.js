function statcord() {
    // Ensure that a 'statcord' object exists, even if not configured
    global.statcord = null;

    let key = require('../1/config.json')['statcord'];
    if (!key || key === 'no') {
        console.log('[INFO] statcord is not configured');
        return;
    } else {
        const Statcord = require('statcord.js');

        const statcord = new Statcord.Client({
            client,
            key: key,
            postCpuStatistics: false /* Whether to post memory statistics or not, defaults to true */,
            postMemStatistics: false /* Whether to post memory statistics or not, defaults to true */,
            postNetworkStatistics: false /* Whether to post memory statistics or not, defaults to true */,
        });
        statcord.on('autopost-start', () => {
            // Emitted when statcord autopost starts
            console.log('[POST] started autopost');
        });

        statcord.on('post', (status) => {
            // status = false if the post was successful
            // status = "Error message" or status = Error if there was an error
            if (!status) {
                //console.log('[POST] successful Statcord post');
            } else console.error(status);
        });
        statcord.autopost().catch((error) => {
            console.log(error);
            console.error('[ERROR] Something is wrong with statcord autopost');
        });

        // Make available globally
        global.statcord = statcord;
    }
}

function discordbotlist() {
    const key = require('../1/config.json')['discordbotlist'];
    if (!key || key === 'no') {
        console.log('[INFO] discordbotlist is not configured');
        return;
    }

    const fetch = require('node-fetch');

    let users = client.users.cache.size;
    let guilds = client.guilds.cache.size;

    const body = {
        users: users,
        guilds: guilds,
    };
    fetch(`https://discordbotlist.com/api/v1/bots/591922988832653313/stats`, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
            Authorization: key,
            'Content-Type': 'application/json',
        },
    })
        .then((res) => {
            res.json();
            console.log('[POST] Posted to discordbotlist');
        })
        .catch((error) => {
            console.log(error);
        });
}

module.exports = {
    statcord,
    discordbotlist,
};
