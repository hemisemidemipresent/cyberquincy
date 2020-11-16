const mk = require('../jsons/mk/mk.json');
const Discord = require('discord.js');
const { purple } = require('../jsons/colours.json');
module.exports = {
    name: 'mk',
    rawArgs: true,
    execute(message, args) {
        /*
            In the game, there are KnowledgeSetModels (primary, military, etc...) which are an array of KnowledgeTierModels (investmentRequired is constant) which are an array of KnowledgeLevelModels (monkeymoney cost is constant and the level they are positioned is also constant) which are an array of KnowledgeModels
        */
        let input = args.join('');

        for (h = 0; h < mk.length; h++) {
            let knowledgeSetModels = mk[h];

            for (let i = 0; i < knowledgeSetModels.length; i++) {
                let KnowledgeTiers = knowledgeSetModels[i].knowledgeSets;

                for (let j = 0; j < KnowledgeTiers.length; j++) {
                    let KnowledgeLevel = KnowledgeTiers[j].knowledges;

                    for (let k = 0; k < KnowledgeLevel.length; k++) {
                        let knowledge = KnowledgeLevel[k];
                        let id = knowledge.id.toLowerCase();

                        if (id.includes(input)) {
                            return displayKnowledge(h, i, j, k);
                        }
                    }
                }
            }
        }
        function displayKnowledge(h, i, j, k) {
            let knowledge = mk[h][i].knowledgeSets[j].knowledges[k];

            let id = knowledge.id;
            let name = unCamelCase(id);
            let prerequisites = knowledge.prerequisites;
            let formattedPrerequisites = [];
            let mmCost = mk[h][i].knowledgeSets[j].mmCost;
            let investmentRequired = mk[h][i].investmentRequired;
            for (let m = 0; m < prerequisites.length; m++) {
                formattedPrerequisites.push(unCamelCase(prerequisites[m]));
            }
            let finalPrereqs = '';
            if (formattedPrerequisites.length == 0) {
                finalPrereqs = 'none';
            } else {
                finalPrereqs = formattedPrerequisites.join(' ,');
            }

            let embed = new Discord.MessageEmbed()
                .setTitle(name)
                .addField('prerequisites', `${finalPrereqs}`, true)
                .addField('mmCost', mmCost, true)
                .addField('investment required', investmentRequired, true)
                .setColor(purple);
            return message.channel.send(embed);
        }
        function unCamelCase(string) {
            let str = string
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, function (str) {
                    return str.toUpperCase();
                });
            return str;
        }
    },
};
