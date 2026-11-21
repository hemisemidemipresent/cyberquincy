import type template from '../1/template.json';

/** The shape of 1/config.json, which holds the bot's secrets; 1/template.json is its committed template */
type BotConfig = typeof template;

// 1/config.json isn't committed, so it's read when needed rather than imported, which would make the type check depend on it
function loadConfig(): BotConfig {
    return require('../1/config.json');
}

function activeToken(): string {
    const { testing, token, testToken } = loadConfig();
    return testing ? testToken : token;
}

function activeClientID(): string {
    const { testing, client, testClient } = loadConfig();
    return testing ? testClient : client;
}

export { activeToken, activeClientID };
export type { BotConfig };
