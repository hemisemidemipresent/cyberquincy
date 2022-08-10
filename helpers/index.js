const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

//////////////////////////////////////////////////////
// Cacheing
//////////////////////////////////////////////////////

const fs = require('fs');
const resolve = require('path').resolve;
const gHelper = require('../helpers/general');
const discordHelper = require('../helpers/discord.js');

DIR1 = 'cache';
DIR2 = 'index';

function hasCachedInfo(fname) {
    return fs.existsSync(resolve(DIR1, DIR2, fname));
}

function fetchCachedInfo(fname) {
    const data = fs.readFileSync(resolve(DIR1, DIR2, fname));
    return JSON.parse(data).info;
}

function cacheInfo(info, fname) {
    const fileData = JSON.stringify({ info: info });

    const dir1 = resolve(DIR1);
    if (!fs.existsSync(dir1)) {
        fs.mkdirSync(dir1);
    }
    const dir2 = resolve(DIR1, DIR2);
    if (!fs.existsSync(dir2)) {
        fs.mkdirSync(dir2);
    }
    fs.writeFileSync(resolve(DIR1, DIR2, fname), fileData, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

function getLastCacheModified(info) {
    return fs.statSync(resolve(DIR1, DIR2, `${info}.json`)).mtime;
}

//////////////////////////////////////////////////////
// Parsing
//////////////////////////////////////////////////////

async function fetchInfo(info, reload = false) {
    cacheFname = `${info}.json`;
    let allCombos;
    if (hasCachedInfo(cacheFname) && !reload) {
        allCombos = await fetchCachedInfo(cacheFname);
    } else {
        allCombos = await scrapeInfo(info);
        cacheInfo(allCombos, cacheFname);
    }
    return allCombos;
}

const { scrapeAll2TCCombos } = require('../services/index/2tc_scraper.js');
const { scrapeAll2MPCompletions } = require('../services/index/2mp_scraper.js');
const { scrapeAllFTTCCombos } = require('../services/index/fttc_scraper');
const { scrapeAllBalanceChanges } = require('../services/index/balances_scraper');

async function scrapeInfo(info) {
    switch (info) {
        case '2tc':
            return await scrapeAll2TCCombos();
        case '2mp':
            return await scrapeAll2MPCompletions();
        case 'fttc':
            return await scrapeAllFTTCCombos();
        case 'balances':
            return await scrapeAllBalanceChanges();
        default:
            throw 'Scraper not found';
    }
}

// Parses the map notes by splitting on comma and colon to get the map+person+link
function parseMapNotes(notes) {
    if (!notes) return {};
    return Object.fromEntries(
        notes
            .trim()
            .split('\n')
            .map((n) => {
                let altmap, altperson, altbitly;
                [altmap, altperson, altbitly] = n.split(/[,:]/).map((t) => t.replace(/ /g, ''));

                return [
                    altmap,
                    {
                        PERSON: altperson,
                        LINK: `[${altbitly}](http://${altbitly})`
                    }
                ];
            })
    );
}

//////////////////////////////////////////////////////
// Formatting
//////////////////////////////////////////////////////

function altMapsFields(ogMapAbbr, allCompletedMapAbbrs, isWaterEntity) {
    const completedAltMaps = allCompletedMapAbbrs.filter((m) => m != ogMapAbbr);

    let mapDifficultyGroups = [
        Aliases.beginnerMaps(),
        Aliases.intermediateMaps(),
        Aliases.advancedMaps(),
        Aliases.expertMaps()
    ];
    if (isWaterEntity) {
        mapDifficultyGroups = mapDifficultyGroups.map((aliases) =>
            aliases.filter((map) => Aliases.allWaterMaps().includes(map))
        );
    }
    mapDifficultyGroups = mapDifficultyGroups.map((aliases) =>
        aliases.map((alias) => Aliases.mapToIndexAbbreviation(alias))
    );

    const altMapGroups = mapDifficultyGroups.map((mapGroup) => mapGroup.filter((map) => completedAltMaps.includes(map)));
    const unCompletedAltMapGroups = mapDifficultyGroups.map((mapGroup) =>
        mapGroup.filter((map) => !completedAltMaps.concat(ogMapAbbr).includes(map))
    );

    let wordAllIncluded = false;

    const displayedMapGroups = gHelper.range(0, altMapGroups.length - 1).map((i) => {
        mapDifficulty = ['BEG', 'INT', 'ADV', 'EXP'][i];
        waterTowerAsterisk = isWaterEntity ? '*' : '';
        if (unCompletedAltMapGroups[i] == 0) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk}`;
        } else if (unCompletedAltMapGroups[i].length < 5) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk} - {${unCompletedAltMapGroups[i].join(', ')}}`;
        } else if (altMapGroups[i].length == 0) {
            return '';
        } else {
            return `{${altMapGroups[i].join(', ')}}`;
        }
    });

    let completedAltMapsString = '';
    if (displayedMapGroups.some((group) => group.length > 0)) {
        completedAltMapsString += `\n${displayedMapGroups[0]}`;
        completedAltMapsString += `\n${displayedMapGroups[1]}`;
        completedAltMapsString += `\n${displayedMapGroups[2]}`;
        completedAltMapsString += `\n${displayedMapGroups[3]}`;
        completedAltMapsString;
    } else {
        completedAltMapsString = 'None';
    }

    completedAltMapsFooter = isWaterEntity && wordAllIncluded ? '*with water' : null;

    return {
        field: completedAltMapsString,
        footer: completedAltMapsFooter
    };
}

const singlepageButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mobile').setLabel('📱').setStyle(ButtonStyle.Secondary)
);

const multipageButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('-1').setLabel('⬅️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('1').setLabel('➡️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('mobile').setLabel('📱').setStyle(ButtonStyle.Secondary)
);

async function displayOneOrMultiplePages(interaction, colData, setCustomFields) {
    MAX_NUM_ROWS = 15;
    const numRows = Object.values(colData)[0].length;
    let leftIndex = 0;
    let rightIndex = Math.min(MAX_NUM_ROWS - 1, numRows - 1);
    let mobile = false;

    /**
     * creates embed for next page
     * @param {int} direction
     * @returns {EmbedBuilder}
     */
    async function createPage(direction = 1) {
        // The number of rows to be displayed is variable depending on the characters in each link
        // Try 15 and decrement every time it doesn't work.
        for (maxNumRowsDisplayed = rightIndex + 1 - leftIndex; maxNumRowsDisplayed > 0; maxNumRowsDisplayed--) {
            let challengeEmbed = new Discord.EmbedBuilder();

            challengeEmbed.addFields([
                { name: '# Combos', value: `**${leftIndex + 1}**-**${rightIndex + 1}** of ${numRows}` }
            ]);

            let fields = [];
            if (mobile) {
                // PADDING
                let colWidths = [];
                for (header in colData) {
                    const data = colData[header].slice(leftIndex, rightIndex + 1);

                    colWidths.push(Math.max(...data.concat(header).map((row) => row.length)));
                }

                // HEADER
                const headers = Object.keys(colData);
                if (headers.slice(0, -1).includes('LINK')) {
                    throw 'LINK column cannot appear anywhere but the last column for mobile formatting purposes';
                }
                let headerField = headers
                    .map((header, colIndex) =>
                        header == 'LINK' ? header.padEnd(15, ' ') : header.padEnd(colWidths[colIndex], ' ')
                    )
                    .join(' | ');
                headerField = `\`${headerField}\``;

                // VALUES
                let rowField = '';
                for (let rowIndex = leftIndex; rowIndex < rightIndex + 1; rowIndex++) {
                    const rowData = headers.map((header) => colData[header][rowIndex]);
                    let rowText = '`';
                    rowText += rowData
                        .map((cellData, colIndex) => {
                            // Don't display LINK in formatted mode
                            // Close the line's opening tick (`) mark before the LINK
                            // Otherwise, close the line's opening tick mark after the last column
                            if (headers[colIndex] == 'LINK') {
                                return `\`${cellData}`;
                            } else {
                                text = cellData.padEnd(colWidths[colIndex], ' ');
                                if (colIndex == rowData.length - 1) text += '`';
                                return text;
                            }
                        })
                        .join(' | ');
                    rowField += rowText + '\n';
                }

                fields.push({ name: headerField, value: rowField, inline: true });
            } else {
                for (header in colData) {
                    const data = colData[header].slice(leftIndex, rightIndex + 1);

                    fields.push({
                        name: gHelper.toTitleCase(header.split('_').join(' ')),
                        value: data.join('\n'),
                        inline: true
                    });
                }
            }

            if (fields.every((field) => field.value.length <= 1024)) {
                challengeEmbed.addFields(fields);
                setCustomFields(challengeEmbed);
                return [challengeEmbed, numRows > maxNumRowsDisplayed];
            }

            if (direction > 0) rightIndex--;
            if (direction < 0) leftIndex++;
        }
    }

    async function displayPages(direction = 1) {
        let [embed, multipage] = await createPage(direction);

        await interaction.editReply({
            embeds: [embed],
            components: multipage ? [multipageButtons] : [singlepageButtons]
        });

        const filter = (selection) => {
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
        };

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 20000
        });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            buttonInteraction.deferUpdate();

            switch (buttonInteraction.customId) {
                case 'mobile':
                    mobile = !mobile;
                    await displayPages(direction);
                    break;
                case '-1':
                    rightIndex = (leftIndex - 1 + numRows) % numRows;
                    leftIndex = rightIndex - (MAX_NUM_ROWS - 1);
                    if (leftIndex < 0) leftIndex = 0;
                    await displayPages(-1);
                    break;
                case '1':
                    leftIndex = (rightIndex + 1) % numRows;
                    rightIndex = leftIndex + (MAX_NUM_ROWS - 1);
                    if (rightIndex >= numRows) rightIndex = numRows - 1;
                    await displayPages(1);
                    break;
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
    }

    // Gets the reaction to the pagination message by the command author
    // and respond by turning the page in the correction direction

    await displayPages(1);
}

module.exports = {
    getLastCacheModified,
    fetchInfo,

    parseMapNotes,
    altMapsFields,

    displayOneOrMultiplePages
};
