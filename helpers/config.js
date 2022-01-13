function activeToken() {
   const { testing, token, testToken } =  require('../1/config.json');
   return testing ? testToken : token;
}

module.exports = {
    activeToken,
}