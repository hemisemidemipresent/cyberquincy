const fact = require('../jsons/fact.json');
module.exports = {
    name: 'fact',
    description: 'random fact/lore from the NK blog. BIG credit to it',
    aliases: ['random', 'f'],
    execute(message, args, client) {
        function searchStringInArray(str, strArray) {
            let resultArray = [];
            for (let j = 0; j < strArray.length; j++) {
                if (strArray[j].toLowerCase().includes(str.toLowerCase())) {
                    resultArray.push(j);
                }
            }
            return resultArray; // this is an array containing the array of all the facts that contain the key terms
        }
        let searchedString = args.join(' ');
        let randex; // short for random index
        if (!args[0]) {
            randex = Math.floor(Math.random() * fact.length);
        } else if (isNaN(searchedString)) {
            let factsArray = searchStringInArray(searchedString, fact);
            if (factsArray.length == 0) {
                return message.channel.send(
                    `Unfortunately I did not find any results from \`\`${searchedString}\`\`. Try searching a phrase which is simpler.`
                );
            } else if (factsArray.length > 5) {
                return message.channel.send(
                    `There are too many results to send! They are fact number ${factsArray.join()}`
                );
            } else {
                let factOutput = [];
                for (let i = 0; i < factsArray.length; i++) {
                    factOutput.push(fact[parseInt(factsArray[i])]);
                }
                console.log(factOutput.join('\n'));
                return message.channel.send(
                    `I found ${
                        factsArray.length
                    } fact(s) containing the word/phrase "${searchedString}"!\n${factOutput.join(
                        '\n'
                    )}`
                );
            }
        } else {
            randex = parseInt(args[0]);
        }
        let factInfo = fact[randex];
        message.channel.send(`${factInfo}`);
    },
};
