class ImgurAttachmentError extends Error {}

function extractImageInfo(msgAttachments, msgArgs) {
    console.log(msgAttachments);
    let image;
    if (msgAttachments.size > 0) {
        let attachement_image = msgAttachments.first();
        image = attachement_image.url;
    } else if (isValidImageLink(msgArgs[0])) {
        image = msgArgs.shift();
    }

    if (!image)
        throw new ImgurAttachmentError(
            'Must attach an image or provide an image link as first argument'
        );

    return [image, msgArgs.join(' ')];
}

VALID_IMAGE_TYPES = ['.jpg', '.png', '.jpeg', '.tiff', '.tif', '.bmp', '.jpe', '.jfif', '.dib'];

function isValidImageLink(string) {
    return isValidHttpUrl(string) && VALID_IMAGE_TYPES.some((typ) => string.endsWith(typ));
}

function isValidHttpUrl(string) {
    try {
        new URL(string);
    } catch (_) {
        return false;
    }

    return true;
}

module.exports = {
    extractImageInfo,
    ImgurAttachmentError
};
