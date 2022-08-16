const { parse } = require('@ltd/j-toml');
const { SlashCommandBuilder, Collection, Formatters, AutocompleteInteraction } = require('discord.js');
const { readFileSync } = require('fs');
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
	let content = cache.get(query)?.content;

	content ??= `Couldn't find a tag with the name ${Formatters.bold(query)}.`;

	return interaction.reply({ content });
}

function onAutocomplete(interaction) {
	const query = interaction.options.getFocused().toLowerCase();

	if (!query) {
		const featured = cache.firstKey(25).map((name) => ({
			name,
			value: name,
		}));

		return interaction.respond(featured);
	}

	const tags = cache.filter(({ keywords }) => keywords.some((kw) => kw.includes(query)));

	const responseArr = tags.map(({ keywords }) => ({
		name: keywords.at(-1),
		value: keywords.at(-1),
	}));

	return interaction.respond(responseArr);
}

function populateTagCache() {
	const file = readFileSync('./tags/tags.toml', 'utf8');
	const data = parse(file, '\n');
	const cache = new Collection();

	for (const [key, value] of Object.entries(data)) {
		value.keywords?.push(key) ?? (value.keywords = [key]);
		cache.set(key, value);
	}

	return cache;
}

module.exports = {
	data: builder,
	execute,
	onAutocomplete,
};
