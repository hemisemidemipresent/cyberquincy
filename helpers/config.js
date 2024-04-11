function activeToken() {
    const { testing, token, testToken } = require('../1/config.json');
    return testing ? testToken : token;
}
function activeClientID() {
    const { testing, client, testClient } = require('../1/config.json');
    return testing ? testClient : client;
}

module.exports = {
    activeToken,
    activeClientID
};
