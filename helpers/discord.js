function isValidFormBody(embed) {
    for (const embedField of embed.fields) {
        if (embedField.value.length > 1024) return false;
    }
    return true;
}

module.exports = {
    isValidFormBody,
}