const Emojis = require('../jsons/emojis.json')

// Prompts the user to react with an emoji that's a part of <group>
//
// Go to jsons/emojis.json and make sure that the emojis
// can be found under { <guild> : { <group> : <emoji-map> } }
// 
// This reactor will add { group: <emoji-map-key> } to the `results` object
// e.g. { hero: 'obyn'} OR { map_difficulty: 'advanced' }
//
// Will pick deFault if not null and ignore the above steps
class EmojiReactor {
    constructor(group, guild, deFault) {
        this.group = group
        this.guild = guild
        this.default = deFault // Will replace execute() if non nil
    }

    execute(message, chain, results) {
        // Continue to the next interaction if default is provided
        if (this.default) {
            results[this.group] = this.default;
            chain.shift()(message, chain, results)
            return;
        }
        
        (async () => {
            // Await the prompt message so reactions may be added to it immediately
            const reactMessage = await message.channel.send(`React with the ${this.group.split('_').join(' ')} you want to choose!`)

            // Take emojis specified by guild and group
            // React with each on the prompt message for the user to follow up on
            const emojis = Emojis[this.guild.toString()][this.group]
            for (const emoji in emojis) {
                reactMessage.react(
                    client.guilds.cache
                        .get(this.guild) // this is the server with the emojis the bot uses
                        .emojis.cache.get(emojis[emoji])
                );
            }

            // Set-up collector that'll read the user emoji response
            let collector = reactMessage
                .createReactionCollector(
                    (reaction, user) =>
                        user.id === message.author.id && 
                        Object.values(emojis).includes(reaction.emoji.id),
                    { time: 20000 } // might turn into function to check later
                )
            
            collector.once('collect', (reaction) => {
                // Find the key-name of the emoji with which the user reacted
                const collectedEmoji = Object.keys(emojis).find(
                    (key) => emojis[key] === reaction.emoji.id
                );
                
                collector.stop();

                // Add the result
                results[this.group] = collectedEmoji
    
                // Invoke first method in chain and remove it from the array
                // Then pass in the new chain with the first element having been removed
                // This progresses the react-loop.
                chain.shift()(message, chain, results)
            });
        })();
    }
}

module.exports = EmojiReactor