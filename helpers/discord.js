function isValidFormBody(embed) {
    for (const embedField of embed.fields) {
        if (!isValidEmbedField(embedField.value)) return false;
    }
    return true;
}

function isValidEmbedField(text) {
    return text.length <= 1024;
}

module.exports = {
    isValidEmbedField,
    isValidFormBody,
};