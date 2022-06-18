const { SlashCommandBuilder } = require('@discordjs/builders');
const nodefetch = require('node-fetch');
const nksku = require('nksku');

const { UserAgent } = require('../1/config.json');
const { discord } = require('../aliases/misc.json');

const { red, green } = require('../jsons/colours.json');

const appID = 11;
const skuID = 35;
const sessionID = null;
const deviceID = null;

builder = new SlashCommandBuilder()
    .setName('userid')
    .setDescription("Get your (or any other person's) user ID")

    .addStringOption((option) =>
        option
            .setName('challenge_code')
            .setDescription('A challenge code from the person whose user ID you want to find')
            .setRequired(true)
    );

async function execute(interaction) {
    const challengeCode = interaction.options.getString('challenge_code').toLowerCase();
    const objStr = `{"index":"challenges","query":"id:${challengeCode}","limit":1,"offset":0,"hint":"single_challenge","options":{}}`;
    const embed = await request(objStr);
    interaction.reply({ embeds: [embed] });
}

async function request(objStr) {
    const nonce = Math.random() * Math.pow(2, 63) + '';
    try {
        let k = await nodefetch('https://api.ninjakiwi.com/utility/es/search', {
            method: 'POST',
            body: JSON.stringify({
                data: objStr,
                auth: {
                    session: sessionID,
                    appID: appID,
                    skuID: skuID,
                    device: deviceID
                },
                sig: nksku.signonce.sign(objStr, nonce),
                nonce: nonce
            }),
            headers: { 'User-Agent': UserAgent, 'Content-Type': 'application/json' }
        });
        let res = await k.json();
        let results = JSON.parse(res.data).results[0];
        return new Discord.MessageEmbed()
            .setTitle('Success!')
            .setDescription(`The owner of the challenge's userID is \`${results.owner}\``)
            .addField('challenge name', results.challengeName)
            .setColor(green);
    } catch (error) {
        console.log(error);
        return new Discord.MessageEmbed()
            .setTitle('Invalid Challenge Code!')
            .addField('In case this is a valid challenge code:', `report it to the [discord server](${discord})`)
            .setColor(red);
    }
}
module.exports = {
    data: builder,
    beta: true,
    execute
};
