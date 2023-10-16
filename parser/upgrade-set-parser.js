class UpgradeSetParser {
    type() {
        return 'upgrade_set';
    }

    parse(arg) {
        arg = arg.replace(/[-|/]/g, '');
        if (!Towers.isValidUpgradeSet(arg)) {
            throw new UserCommandError(`\`${arg}\` is not a valid BTD6 upgrade set`);
        }
        return arg;
    }
}

module.exports = UpgradeSetParser;
