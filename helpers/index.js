const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

//////////////////////////////////////////////////////
// Cacheing 
//////////////////////////////////////////////////////

const fs = require('fs')
const resolve = require('path').resolve;
const gHelper = require('../helpers/general')
const discordHelper = require('../helpers/discord.js');

DIR1 = 'cache'
DIR2 = 'index'

function hasCachedCombos(fname) {
    return fs.existsSync(resolve(DIR1, DIR2, fname))
}

function fetchCachedCombos(fname) {
    const data = fs.readFileSync(resolve(DIR1, DIR2, fname))
    return JSON.parse(data).combos;
}

function cacheCombos(combos, fname) {
    const fileData = JSON.stringify({ combos: combos })

    const dir1 = resolve(DIR1)
    if (!fs.existsSync(dir1)){
        fs.mkdirSync(dir1);
    }
    const dir2 = resolve(DIR1, DIR2)
    if (!fs.existsSync(dir2)){
        fs.mkdirSync(dir2);
    }
    fs.writeFileSync(resolve(DIR1, DIR2, fname), fileData, err => {
        if (err) {
            console.error(err)
        }
    })
}

function getLastCacheModified(fname) {
    return fs.statSync(resolve(DIR1, DIR2, fname)).mtime
}

//////////////////////////////////////////////////////
// Parsing 
//////////////////////////////////////////////////////

// Parses the map notes by splitting on comma and colon to get the map+person+link
function parseMapNotes(notes) {
    if (!notes) return {};
    return Object.fromEntries(
        notes
            .trim()
            .split('\n')
            .map((n) => {
                let altmap, altperson, altbitly;
                [altmap, altperson, altbitly] = n
                    .split(/[,:]/)
                    .map((t) => t.replace(/ /g, ''));

                return [
                    altmap,
                    {
                        PERSON: altperson,
                        LINK: `[${altbitly}](http://${altbitly})`,
                    },
                ];
            })
    );
}

//////////////////////////////////////////////////////
// Formatting 
//////////////////////////////////////////////////////

function altMapsFields(ogMapAbbr, allCompletedMapAbbrs, isWaterEntity) {
    const completedAltMaps = allCompletedMapAbbrs.filter(m => m != ogMapAbbr);

    let mapDifficultyGroups = [
        Aliases.beginnerMaps(),
        Aliases.intermediateMaps(),
        Aliases.advancedMaps(),
        Aliases.expertMaps(),
    ];
    if (isWaterEntity) {
        mapDifficultyGroups = mapDifficultyGroups.map((aliases) =>
            aliases.filter((map) => Aliases.allWaterMaps().includes(map))
        );
    }
    mapDifficultyGroups = mapDifficultyGroups.map((aliases) =>
        aliases.map((alias) => Aliases.mapToIndexAbbreviation(alias))
    );

    const altMapGroups = mapDifficultyGroups.map((mapGroup) =>
        mapGroup.filter((map) => completedAltMaps.includes(map))
    );
    const unCompletedAltMapGroups = mapDifficultyGroups.map((mapGroup) =>
        mapGroup.filter((map) => !completedAltMaps.concat(ogMapAbbr).includes(map))
    );

    let wordAllIncluded = false

    const displayedMapGroups = gHelper.range(0, altMapGroups.length - 1).map((i) => {
        mapDifficulty = ['BEG', 'INT', 'ADV', 'EXP'][i];
        waterTowerAsterisk = isWaterEntity ? '*' : '';
        if (unCompletedAltMapGroups[i] == 0) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk}`;
        } else if (unCompletedAltMapGroups[i].length < 5) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk} - {${unCompletedAltMapGroups[
                i
            ].join(', ')}}`;
        } else if (altMapGroups[i].length == 0) {
            return '';
        } else {
            return `{${altMapGroups[i].join(', ')}}`;
        }
    });
    
    let completedAltMapsString = '';
    if (displayedMapGroups.some(group => group.length > 0)) {
        completedAltMapsString += `\n${displayedMapGroups[0]}`;
        completedAltMapsString += `\n${displayedMapGroups[1]}`;
        completedAltMapsString += `\n${displayedMapGroups[2]}`;
        completedAltMapsString += `\n${displayedMapGroups[3]}`;
        completedAltMapsString;
    } else {
        completedAltMapsString = 'None';
    }

    completedAltMapsFooter = isWaterEntity && wordAllIncluded ? '*with water' : null

    return {
        field: completedAltMapsString,
        footer: completedAltMapsFooter
    }
}

const multipageButtons = new MessageActionRow().addComponents(
    new MessageButton().setCustomId('-1').setLabel('⬅️').setStyle('PRIMARY'),
    new MessageButton().setCustomId('1').setLabel('➡️').setStyle('PRIMARY')
);

async function displayOneOrMultiplePages(interaction, colData, setCustomFields) {
    MAX_NUM_ROWS = 15;
    const numRows = Object.values(colData)[0].length;
    let leftIndex = 0;
    let rightIndex = Math.min(MAX_NUM_ROWS - 1, numRows - 1);

    /**
     * creates embed for next page
     * @param {int} direction
     * @returns {MessageEmbed}
     */
    async function createPage(direction = 1) {
        // The number of rows to be displayed is variable depending on the characters in each link
        // Try 15 and decrement every time it doesn't work.
        for (
            maxNumRowsDisplayed = MAX_NUM_ROWS;
            maxNumRowsDisplayed > 0;
            maxNumRowsDisplayed--
        ) {
            let challengeEmbed = new Discord.MessageEmbed()

            challengeEmbed.addField(
                '# Combos',
                `**${leftIndex + 1}**-**${rightIndex + 1}** of ${numRows}`
            );

            for (header in colData) {
                const data =
                    numRows <= maxNumRowsDisplayed
                        ? colData[header]
                        : colData[header].slice(leftIndex, rightIndex + 1);

                challengeEmbed.addField(
                    gHelper.toTitleCase(header.split('_').join(' ')),
                    data.join('\n'),
                    true
                );
            }

            setCustomFields(challengeEmbed)

            if (discordHelper.isValidFormBody(challengeEmbed)) {
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
            components: multipage ? [multipageButtons] : [],
        });

        if (!multipage) return;

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
            componentType: 'BUTTON',
            time: 20000
        });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            buttonInteraction.deferUpdate();

            switch (parseInt(buttonInteraction.customId)) {
                case -1:
                    rightIndex = (leftIndex - 1 + numRows) % numRows;
                    leftIndex = rightIndex - (MAX_NUM_ROWS - 1);
                    if (leftIndex < 0) leftIndex = 0;
                    await displayPages(-1);
                    break;
                case 1:
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
    hasCachedCombos,
    fetchCachedCombos,
    cacheCombos,
    getLastCacheModified,

    parseMapNotes,

    altMapsFields,
    displayOneOrMultiplePages,
}