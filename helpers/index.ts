import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder
} from 'discord.js';

import { z } from 'zod';
import * as gHelper from './general';
import * as Maps from './maps';
import IndexAPIError from '../exceptions/index-api-error';
import {
    FTTCCompletionSchema,
    LTCCompletionSchema,
    LowestCostCompletionSchema,
    TwoMPCompletionSchema,
    TwoMPOGInfoSchema,
    TwoTCCompletionSchema,
    indexPageResponseSchema,
    indexResultsResponseSchema
} from '../types/btd6index';

import type { CompletionBase, IndexPageResponse } from '../types/btd6index';

//////////////////////////////////////////////////////
// btd6index.win API
//////////////////////////////////////////////////////

// Each fetch-* endpoint's response schema, keyed by the endpoint name after `fetch-`
const INDEX_RESPONSE_SCHEMAS = {
    '2tc': indexPageResponseSchema(TwoTCCompletionSchema),
    '2mp': indexPageResponseSchema(TwoMPCompletionSchema),
    '2mp-og-info': TwoMPOGInfoSchema,
    fttc: indexPageResponseSchema(FTTCCompletionSchema),
    ltc: indexResultsResponseSchema(LTCCompletionSchema),
    lcc: indexResultsResponseSchema(LowestCostCompletionSchema),
    lcd: indexResultsResponseSchema(LowestCostCompletionSchema),
};
type IndexEndpoint = keyof typeof INDEX_RESPONSE_SCHEMAS;

/**
 * Fetches and checks a btd6index.win fetch-* endpoint, e.g. `fetchIndex('2tc', params)` for `/fetch-2tc?...`.
 * Throws an IndexAPIError if the site is unreachable, reports an error, or sends a response that doesn't match its schema
 */
async function fetchIndex<E extends IndexEndpoint>(
    endpoint: E,
    searchParams: URLSearchParams
): Promise<z.infer<(typeof INDEX_RESPONSE_SCHEMAS)[E]>> {
    const url = `https://btd6index.win/fetch-${endpoint}?${searchParams}`;

    let res: Response;
    try {
        res = await fetch(url);
    } catch (e) {
        throw new IndexAPIError(url, `request failed: ${e}`);
    }
    if (!res.ok) throw new IndexAPIError(url, `HTTP ${res.status}`);

    let body: unknown;
    try {
        body = await res.json();
    } catch {
        throw new IndexAPIError(url, 'response is not JSON');
    }
    if (body && typeof body === 'object' && 'error' in body) {
        throw new IndexAPIError(url, `API reported an error: ${body.error}`);
    }

    const parsed = INDEX_RESPONSE_SCHEMAS[endpoint].safeParse(body);
    if (!parsed.success) throw new IndexAPIError(url, `unexpected response:\n${z.prettifyError(parsed.error)}`);
    return parsed.data as z.infer<(typeof INDEX_RESPONSE_SCHEMAS)[E]>;
}

//////////////////////////////////////////////////////
// Formatting
//////////////////////////////////////////////////////

// Display text for a completion's version or date, which the API sends as null or "" when unknown
function orUnknown(value: string | null | undefined): string {
    return value || '???';
}

/**
 * Formats the maps a 2MP has been completed on, grouped by map difficulty.
 * Map arguments are index abbreviations; completed maps without one (null) are ignored
 */
function altMapsFields(
    ogMapAbbr: string | null,
    allCompletedMapAbbrs: (string | null)[],
    impossibleMaps: string[]
): { field: string; footer: string | null } {
    const completedAltMaps = allCompletedMapAbbrs.filter((m) => m != ogMapAbbr);

    const mapDifficultyGroups = [
        Maps.beginnerMaps(),
        Maps.intermediateMaps(),
        Maps.advancedMaps(),
        Maps.expertMaps()
    ].map((maps) => maps.map((map) => Maps.mapToIndexAbbreviation(map)));
    const possibleMapDifficultyGroups = mapDifficultyGroups.map((abbrs) =>
        abbrs.filter((map) => !impossibleMaps.includes(map))
    );

    const altMapGroups = possibleMapDifficultyGroups.map((mapGroup) => mapGroup.filter((map) => completedAltMaps.includes(map)));
    const unCompletedAltMapGroups = possibleMapDifficultyGroups.map((mapGroup) =>
        mapGroup.filter((map) => !completedAltMaps.concat(ogMapAbbr).includes(map))
    );

    let wordAllIncluded = false;

    const displayedMapGroups = gHelper.range(0, altMapGroups.length - 1).map((i: number) => {
        const mapDifficulty = ['BEG', 'INT', 'ADV', 'EXP'][i];
        const existsImpossibleMapInGroup = mapDifficultyGroups[i].some((m) => impossibleMaps.includes(m));
        const possibleAsterisk = impossibleMaps.length > 0 && existsImpossibleMapInGroup ? '*' : '';
        if (unCompletedAltMapGroups[i].length == 0) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${possibleAsterisk}`;
        } else if (unCompletedAltMapGroups[i].length < 5) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${possibleAsterisk} - {${unCompletedAltMapGroups[i].join(', ')}}`;
        } else if (altMapGroups[i].length == 0) {
            return '';
        } else {
            return `{${altMapGroups[i].join(', ')}}`;
        }
    });

    let completedAltMapsString = '';
    if (displayedMapGroups.some((group: string) => group.length > 0)) {
        completedAltMapsString += `\n${displayedMapGroups[0]}`;
        completedAltMapsString += `\n${displayedMapGroups[1]}`;
        completedAltMapsString += `\n${displayedMapGroups[2]}`;
        completedAltMapsString += `\n${displayedMapGroups[3]}`;
    } else {
        completedAltMapsString = 'None';
    }

    const completedAltMapsFooter = impossibleMaps.length > 0 && wordAllIncluded ? '*where placement is possible' : null;

    return {
        field: completedAltMapsString,
        footer: completedAltMapsFooter
    };
}

const singlepageButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('mobile').setLabel('📱').setStyle(ButtonStyle.Secondary)
);

const multipageButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('-1').setLabel('⬅️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('1').setLabel('➡️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('mobile').setLabel('📱').setStyle(ButtonStyle.Secondary)
);

// Only accept button presses from the user who ran the command, on this command's own reply
function isOwnButtonPress(interaction: ChatInputCommandInteraction, selection: ButtonInteraction): boolean {
    // Ensure user clicking button is same as the user that started the interaction
    if (selection.user.id !== interaction.user.id) {
        return false;
    }
    // Ensure that the button press corresponds with this interaction and wasn't
    // a button press on the previous interaction
    if (selection.message.interaction.id !== interaction.id) {
        return false;
    }
    return true;
}

/**
 * Paginates results from a btd6index.win endpoint, using its `count`/`offset` search params
 * and its `{ results, count, more }` response shape
 * @param fetchFn fetches one page for the given search params
 * @param searchParams the query; `count` is the page size, and `offset` is updated as pages are turned
 * @param displayFields column names, in display order; a `Link` column holds a markdown link and is never padded
 * @param completionToFields the text of each column for one completion
 * @param setOtherDisplayFields adds the title, footer etc. to each page's embed
 */
async function displayIndexPages<T extends CompletionBase>(
    interaction: ChatInputCommandInteraction,
    fetchFn: (searchParams: URLSearchParams) => Promise<IndexPageResponse<T>>,
    searchParams: URLSearchParams,
    displayFields: string[],
    completionToFields: (completion: T) => Record<string, string>,
    setOtherDisplayFields: (embed: EmbedBuilder) => void
): Promise<void> {
    const NUM_ROWS = parseInt(searchParams.get('count'));
    let mobile = false;
    let count = 0;

    const createPage = async (): Promise<[EmbedBuilder, boolean]> => {
        let resJson = await fetchFn(searchParams);
        let offset = parseInt(searchParams.get('offset') ?? '0');
        count = resJson.count; // read by the back button to wrap around to the last page

        const challengeEmbed = new EmbedBuilder();

        let content = `**Results ${offset+1}-${offset+resJson.results.length} of ${count}**`;

        const completionsFields = resJson.results.map(completionToFields);
        const fieldWidths = displayFields.map(field => Math.max(
            ...completionsFields.map(completionField => {
                return field === 'Link' ? 4 : completionField[field].length;
            }),
            field.length
        ));
        if (mobile) {
            content += '\n`';
            content += displayFields.map((field, idx) => field.padEnd(fieldWidths[idx])).join(' ');
            content += ' `\n';
            content += completionsFields.map(completionFields => {
                return '`' + displayFields.map((field, idx) => {
                    let val = completionFields[field];
                    let res = field === 'Link' ? val : val.padEnd(fieldWidths[idx]);
                    return field === 'Link' ? '`' + res + '`' : res;
                }).join(' ') + ' `';
            }).join('\n');
        } else {
            challengeEmbed.addFields(displayFields.map(field => {
                return {
                    name: field,
                    value: completionsFields.map(completionFields => completionFields[field]).join('\n'),
                    inline: true
                };
            }));
        }

        challengeEmbed.setDescription(content);
        setOtherDisplayFields(challengeEmbed);
        return [challengeEmbed, resJson.more];
    };

    const displayPages = async (initial: boolean) => {
        let [embed, more] = await createPage();

        await interaction.editReply({ embeds: [embed], components: !initial || more ? [multipageButtons] : [singlepageButtons] });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (selection: ButtonInteraction) => isOwnButtonPress(interaction, selection),
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            buttonInteraction.deferUpdate();

            let offset = parseInt(searchParams.get('offset') ?? '0');

            // Page turns run outside the command's execute(), so slash_command_center can't catch their errors
            try {
                switch (buttonInteraction.customId) {
                    case 'mobile':
                        mobile = !mobile;
                        await displayPages(initial);
                        break;
                    case '-1':
                        if (offset > 0) {
                            searchParams.set('offset', String(Math.max(offset - NUM_ROWS, 0)));
                        } else {
                            searchParams.set('offset', String(Math.floor((count - 1) / NUM_ROWS) * NUM_ROWS));
                        }
                        await displayPages(false);
                        break;
                    case '1':
                        if (more) {
                            searchParams.set('offset', String(offset + NUM_ROWS));
                        } else {
                            searchParams.set('offset', '0');
                        }
                        await displayPages(false);
                        break;
                }
            } catch (e) {
                console.error(e);
                const content = e instanceof IndexAPIError ? e.message : 'There was an error while turning the page!';
                await interaction.editReply({ content, embeds: [], components: [] }).catch(() => {});
            }
        });

        collector.on('end', async (collected) => {
            if (collected.size == 0) {
                await interaction.editReply({
                    embeds: [embed],
                    components: []
                });
            }
        });
    };

    await displayPages(true);
}

// A markdown link to the completion's image/video, labelled by where it is hosted
function genCompletionLink(completion: Pick<CompletionBase, 'link' | 'filekey'>): string {
    let actualLink = completion.link ?? `https://media.btd6index.win/${completion.filekey}`;
    let linkText = 'Link';
    if (actualLink.includes('reddit.com')) {
        linkText = 'Reddit';
    } else if (actualLink.includes('media.btd6index.win')) {
        linkText = 'Image/Video';
    } else if (actualLink.includes('imgur.com')) {
        linkText = 'Imgur';
    } else if (actualLink.includes('youtube.com')) {
        linkText = 'YouTube';
    }
    return `[${linkText}](${actualLink})`;
}

export {
    fetchIndex,

    altMapsFields,
    orUnknown,

    displayIndexPages,
    isOwnButtonPress,
    genCompletionLink,
};
