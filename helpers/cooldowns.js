cooldowns = new Discord.Collection();

module.exports = {
    handleCooldown(command, message) {
        const now = Date.now();
        secondsSince = module.exports.calculateSecondsSinceLastCommandUsage(
            command,
            message.author.id,
            now
        );
        activeCooldownSeconds = module.exports.determineCooldown(
            command,
            message
        );

        // Round to nearest tenth
        secondsLeft = (activeCooldownSeconds - secondsSince).toFixed(1);

        if (secondsLeft <= 0) {
            module.exports.updateCooldown(command, message.author.id, now);
            return true;
        } else {
            module.exports.notifyUser(command, secondsLeft, message);
            return false;
        }
    },

    calculateSecondsSinceLastCommandUsage(command, user_id, now) {
        // Cooldowns are stored as {command.name: {discord_user_id: Date Timestamp}}
        timestamps = cooldowns.get(command.name);

        // Command doesn't have an entry so it was never used
        if (!timestamps) return Infinity;

        timestamp = timestamps[user_id.toString()];

        // Author doesn't have an entry within the command so they never used it
        if (timestamp) return (now - timestamp) / 1000;
        else return Infinity;
    },

    CHANNEL_TOPIC_COOLDOWN_REGEX: /cooldown ?= ?(\d+)/,

    determineCooldown(command, message) {
        // Default
        cooldown = 3;

        // Prioritization:
        // 1. Command specific cooldown in code
        // 2. Channel topic-assigned cooldown
        // 3. 3-second default cooldown
        if (!isNaN(command.cooldown)) {
            cooldown = command.cooldown;
        } else if (message.channel.topic) {

            regex_match = message.channel.topic.match(module.exports.CHANNEL_TOPIC_COOLDOWN_REGEX);
            if (regex_match) {
                [_, cooldown] = regex_match;
            }
        }

        return cooldown;
    },

    updateCooldown(command, user_id, now) {
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection());
        }

        timestamps = cooldowns.get(command.name);
        timestamps[user_id] = now;
    },

    notifyUser(command, secondsLeft, message) {
        message.channel.send(
            `Please wait ${secondsLeft} more second(s) before reusing the \`${command.name}\` command.`
        );
    },
};
