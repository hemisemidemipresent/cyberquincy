// The shared, fully loaded alias repository. Modules are cached, so every file gets the same instance.
import AliasRepositoryModule = require('./alias-repository');

const Aliases = AliasRepositoryModule.AliasRepository.load();

export = Aliases;
