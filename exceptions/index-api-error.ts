// btd6index.win was unreachable or sent a response the bot can't use.
// `message` is shown to the user; `url` and `reason` are for the logs.
class IndexAPIError extends Error {
    constructor(readonly url: string, readonly reason: string) {
        super('BTD6 Index is down/they made a breaking change');
        this.name = 'IndexAPIError';
    }
}

export = IndexAPIError;
