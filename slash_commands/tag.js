const { parse } = require('@ltd/j-toml');
const { Collection, EmbedBuilder, Formatters, SlashCommandBuilder } = require('discord.js');
const { readFileSync } = require('fs');
const { cyber } = require('../jsons/colours.json');
const { templates } = require('../tags/templates');
const cache = populateTagCache();

builder = new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Display a tag by its name or alias')
    .addStringOption((option) =>
        option
            .setName('query')
            .setDescription('The tag name or alias')
            .setAutocomplete(true)
            .setRequired(true)
    );

function execute(interaction) {
    const query = interaction.options.getString('query').toLowerCase();
    const tag = cache.get(query);
    const options = {};

    if (tag) {
        options.content = tag.content;
        options.embeds = tag.embeds;
    } else {
        options.content = `Couldn't find a tag with the name ${Formatters.bold(query)}.`;
        options.ephemeral = true;
    }

    return interaction.reply(options);
}

function onAutocomplete(interaction) {
    const query = interaction.options.getFocused().toLowerCase();

    if (!query) {
        const featured = cache.firstKey(25).map((name) => ({
            name,
            value: name
        }));

        return interaction.respond(featured);
    }

    const tags = cache.filter(({ keywords }) => keywords.some((kw) => kw.includes(query)));

    const responseArr = tags.map(({ keywords }) => ({
        name: keywords.at(-1),
        value: keywords.at(-1)
    }));

    return interaction.respond(responseArr);
}

function resolveTemplateTags(str) {
    return str.replace(/{(\w+)}/g, (match, name) => templates[name] ?? match);
}

function populateTagCache() {
    const file = resolveTemplateTags(readFileSync('./tags/tags.toml', 'utf8'));
    const data = parse(file, '\n');
    const cache = new Collection();

    for (const [key, value] of Object.entries(data)) {
        value.embeds?.forEach((embed, i) => (value.embeds[i] = new EmbedBuilder(embed).setColor(embed.color ?? cyber)));

        value.content ??= '';

        value.keywords?.push(key) ?? (value.keywords = [key]);
        cache.set(key, value);
    }

    return cache;
}

module.exports = {
    data: builder,
    execute,
    onAutocomplete
};
