// <@!190278192> (exclamation optional)
const USER_MENTION_REGEX = /<@!?([0-9]+)>/;

function isMention(mention) {
    return USER_MENTION_REGEX.test(mention);
}

function getDiscordUserFromId(user_id) {
    return client.users.cache.get(user_id);
}

function getDiscordUserFromMention(mention) {
    // The user id is a capture group and is returned second
    [, user_id] = mention.match(USER_MENTION_REGEX);

    return getDiscordUserFromId(user_id);
}

function getMentionFromDiscordUser(user) {
    return `<@${user.id}>`;
}

module.exports = {
    HEMI: '699780654740668426',
    RMLGAMING: '497285447270268939',

    isMention,
    getDiscordUserFromId,
    getDiscordUserFromMention,
    getMentionFromDiscordUser,
};
