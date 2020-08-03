module.exports = {
    HEMI: '699780654740668426',
    RMLGAMING: '497285447270268939',

    // <@!190278192> (exclamation optional)
    USER_MENTION_REGEX: /<@!?([0-9]+)>/,

    isMention(mention) {
        return module.exports.USER_MENTION_REGEX.test(mention);
    },

    getDiscordUserFromMention(mention) {
        // The user id is a capture group and is returned second
        [, user_id] = mention.match(module.exports.USER_MENTION_REGEX);

        return module.exports.getDiscordUserFromId(user_id);
    },

    getMentionFromDiscordUser(user) {
        return `<@${user.id}>`;
    },

    getDiscordUserFromId(user_id) {
        return client.users.cache.get(user_id);
    },
};
