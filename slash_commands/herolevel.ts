import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandIntegerOption,
    SlashCommandBooleanOption
} from 'discord.js';
import Aliases from '../aliases';

import * as gHelper from '../helpers/general';
import * as Maps from '../helpers/maps';
import * as Heroes from '../helpers/heroes';
import Colors from '../helpers/colors';

import type { HeroCanonical, MapDifficultyCanonical } from '../types/aliases';

const { cyber } = Colors;

const heroOption = new SlashCommandStringOption().setName('hero').setDescription('Hero').setRequired(true);
Heroes.allHeroes().forEach((hero) => {
    heroOption.addChoices({ name: Aliases.toIndexNormalForm(hero), value: hero });
});

const heroLevelOption = new SlashCommandIntegerOption()
    .setName('placement_round')
    .setDescription('Round Hero is Placed')
    .setRequired(true);

const mapDifficultyOption = new SlashCommandStringOption()
    .setName('map_difficulty')
    .setDescription('Map Difficulty')
    .setRequired(true);
Maps.allMapDifficulties().forEach((difficulty) => {
    mapDifficultyOption.addChoices({ name: gHelper.toTitleCase(difficulty), value: difficulty });
});

const energizerRoundOption = new SlashCommandIntegerOption()
    .setName('energizer_placement_round')
    .setDescription('Optional Round Energizer was Placed')
    .setRequired(false);

const mkOption = new SlashCommandBooleanOption()
    .setName('monkey_knowledge')
    .setDescription('If monkey knowledge is on or not')
    .setRequired(false);

const builder = new SlashCommandBuilder()
    .setName('herolevel')
    .setDescription('See how heroes level based on your inputted parameters (optionally with energizer)')
    .addStringOption(heroOption)
    .addIntegerOption(heroLevelOption)
    .addStringOption(mapDifficultyOption)
    .addIntegerOption(energizerRoundOption)
    .addBooleanOption(mkOption);

function generateHeroLevels(interaction: ChatInputCommandInteraction): EmbedBuilder {
    // Discord restricts hero and map_difficulty to the choices above
    const hero = interaction.options.getString('hero', true) as HeroCanonical;
    const placementRound = interaction.options.getInteger('placement_round', true);
    const mapDifficulty = interaction.options.getString('map_difficulty', true) as MapDifficultyCanonical;
    const energizerRound = interaction.options.getInteger('energizer_placement_round');
    const mk = interaction.options.getBoolean('monkey_knowledge');

    const heroLevels = Heroes.levelingCurve(hero, placementRound, mapDifficulty, energizerRound || Infinity, mk || false);
    let res = table(Heroes.HERO_LEVELS, Heroes.HERO_LEVELS.map((level) => heroLevels[level]));

    let desc = description(placementRound, mapDifficulty, energizerRound);

    if (mk) desc += `\nThis includes the monkey knowledge **Monkey Education** (+8% XP) **Self Taught Heroes** (+10% XP) and **Monkeys Together Strong** (+5% for a single hero) (stacks multiplicatively)`;

    const embed = new EmbedBuilder()
        .setTitle(`${gHelper.toTitleCase(hero)} Leveling Chart`)
        .setDescription(desc)
        .addFields([{ name: '​', value: `${res}` }])
        .setColor(cyber);
    return embed;
}

function description(placementRound: number, mapDifficulty: MapDifficultyCanonical, energizerRound: number | null): string {
    let description = `Placed: **R${placementRound}**`;
    description += `\nMaps: **${gHelper.toTitleCase(mapDifficulty)}**`;
    if (energizerRound) {
        description += `\nEnergizer: **R${energizerRound}**`;
    }
    return description;
}

function addSpaces(str: number | string, max: number): string {
    return str.toString().padEnd(max);
}

function table(lvl: readonly number[], round: (number | string)[]): string {
    let finalRes = '`level`|`round`\n';
    for (let i = 0; i < 20; i++) {
        let res = '';
        res += `\`${addSpaces(lvl[i], 5)}`;
        res += '|';
        res += `${addSpaces(round[i], 5)}\``;
        finalRes += res;
        finalRes += '\n';
    }
    return finalRes;
}

function validateInput(interaction: ChatInputCommandInteraction): string | undefined {
    const placementRound = interaction.options.getInteger('placement_round', true);
    if (placementRound < 1) {
        return 'Must enter a positive number for round';
    }
    if (placementRound > 100) {
        return "Can't enter starting round > 100";
    }

    const energizerRound = interaction.options.getInteger('energizer_placement_round');
    if (energizerRound) {
        if (energizerRound < 1) {
            return 'Must enter a positive number for energizer round';
        }
        if (energizerRound > 100) {
            return "Can't enter energizer round starting round > 100; just don't enter it since the argument is optional";
        }
    }
}

async function execute(interaction: ChatInputCommandInteraction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            flags: MessageFlags.Ephemeral
        });

    return await interaction.reply({
        embeds: [generateHeroLevels(interaction)]
    });
}

export { builder as data, execute };
