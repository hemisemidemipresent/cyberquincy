// The shared, fully loaded alias repository. require() caches modules, so every file gets the same instance.
const AliasRepository = require('./alias-repository.js');

module.exports = AliasRepository.load();
