module.exports = {
    HMMM: 668312965664997386,

    // <@!190278192> (exclamation optional)
    USER_MENTION_REGEX: /<@!?([0-9]+)>/,

    isMention(mention) {
        return module.exports.USER_MENTION_REGEX.test(mention);
    },

    getUserFromMention(mention) {
        // The user id is a capture group and is returned second
        [,user_id] = mention.match(module.exports.USER_MENTION_REGEX)

        return module.exports.getDiscordUserFromId(user_id);
    },

    getMentionFromDiscordUser(user) {
        return `<@!${user.id}>`
    },

    getDiscordUserFromId(user_id) {
        return client.users.cache.get(user_id);
    },
}