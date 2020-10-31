class EmojiReactor {
    constructor(group, guild, deFault) {
        this.group = group
        this.guild = guild
        this.default = deFault // Will replace execute() if non nil
    }

    execute(message, chain, results) {
        reactMessage = await message.channel.send(`React with the ${this.group.split('_').join(' ')} you want to choose!`)
        
        emojis = Emojis[this.guild.toString()][this.group]
        for (const emoji in emojis) {
            reactMessage.react(
                client.guilds.cache
                    .get(this.guild) // this is the server with the emojis the bot uses
                    .emojis.cache.get(emojis[emoji])
            );
        }
        let collector = reactMessage
            .createReactionCollector(
                (reaction, user) =>
                    user.id === message.author.id && 
                    Object.values(emojis).includes(reaction.emoji.id),
                { time: 20000 } // might turn into function to check later
            )
        
        collector.once('collect', (reaction) => {
                collectedEmoji = Object.keys(emojis).find(
                    (key) => emojis[key] === reaction.emoji.id
                );
                
                collector.stop();
    
                results[this.group] = collectedEmoji
    
                // Invoke first method in chain and remove it from the array
                // Then pass in the new chain with the first element having been removed
                chain.shift()(message, chain, results)
            });
    }
}

module.exports = EmojiReactor