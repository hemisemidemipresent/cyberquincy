const CHANNEL_TOPIC_COOLDOWN_REGEX = /cooldown ?= ?(\d+)/;

const cooldowns = new Discord.Collection();

function handleCooldown(command, message) {
    const now = Date.now();
    let timePassed = getTimePassed(command, message.author.id, now);
    let timeNeeded = getTimeNeeded(command, message);

    // Round to nearest tenth
    let secondsLeft = (timeNeeded - timePassed).toFixed(1);

    if (secondsLeft <= 0) {
        updateCooldown(command, message.author.id, now);
        return true;
    } else {
        notifyUser(command, secondsLeft, message);
        return false;
    }
}

function getTimePassed(command, user_id, now) {
    // Cooldowns are stored as {command.name: {discord_user_id: Date Timestamp}}
    let timestamps = cooldowns.get(command.name);

    // Command doesn't have an entry so it was never used
    if (!timestamps) return Infinity;

    let timestamp = timestamps[user_id.toString()];

    // Author doesn't have an entry within the command (they never used it)
    if (!timestamp) return Infinity;

    // Convert from milliseconds to seconds
    return (now - timestamp) / 1000;
}

function getTimeNeeded(command, message) {
    // Default
    let cooldown = 3;

    // Prioritization:
    // 1. Command specific cooldown in code
    // 2. Channel topic-assigned cooldown
    // 3. 3-second default cooldown
    if (!isNaN(command.cooldown)) {
        cooldown = command.cooldown;
    } else if (message.channel.topic) {
        let regex_match = message.channel.topic.match(
            CHANNEL_TOPIC_COOLDOWN_REGEX
        );
        if (regex_match) {
            cooldown = regex_match[1];
        }
    }

    return cooldown;
}

function updateCooldown(command, user_id, now) {
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    let timestamps = cooldowns.get(command.name);
    timestamps[user_id] = now;
}

function notifyUser(command, secondsLeft, message) {
    message.channel.send(
        `Please wait ${secondsLeft} more second(s) before reusing the \`${command.name}\` command.`
    );
}

module.exports = {
    handleCooldown,
};
