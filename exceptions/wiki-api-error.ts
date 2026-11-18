// bloonswiki.com was unreachable or sent a response the bot can't use.
// `message` is shown to the user; `url` and `reason` are for the logs.
class WikiAPIError extends Error {
    constructor(readonly url: string, readonly reason: string) {
        super('The Bloons Wiki is down/they made a breaking change');
        this.name = 'WikiAPIError';
    }
}

export = WikiAPIError;
