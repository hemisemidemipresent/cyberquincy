class UpgradeParser {
    type() {
        return 'upgrade';
    }

    parse(arg) {
        if (!b.isValidUpgrade(arg)) {
            throw new UserCommandError(`\`${arg}\` is not a valid BTD6 upgrade`);
        }
        return arg;
    }
}

module.exports = UpgradeParser;
