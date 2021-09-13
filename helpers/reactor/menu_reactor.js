const { MessageActionRow } = require('discord.js');

// Prompts the user to react with a menu (MessageSelectMenu)
//
// This reactor will add { group: <customId of the MessageSelectMenuOption> to the `results` object
// e.g. { map_difficulty: 'advanced' }
//
// Will pick deFault if not null and ignore the above steps

class MenuReactor {
    constructor(group, messageSelectMenu, deFault) {
        this.group = group;
        this.messageSelectMenu = messageSelectMenu; // typeof MessageSelectMenu
        this.default = deFault; // Will replace execute() if non nil
    }

    execute(message, chain, results) {
        // Continue to the next interaction if default is provided
        if (this.default) {
            results[this.group] = this.default;
            chain.shift()(message, chain, results);
            return;
        }

        (async () => {
            // Await the prompt message so reactions may be added to it immediately
            // not sure if this is applicable ^ but whatever

            const row = new MessageActionRow().addComponents(
                this.messageSelectMenu
            );

            let reactMessage = await message.channel.send({
                content: `Click the ${this.group
                    .split('_')
                    .join(' ')} you want to choose!`,
                components: [row],
            });

            // Set-up collector that'll read the user response
            const filter = (interaction) =>
                interaction.customId === this.messageSelectMenu.customId &&
                interaction.user.id == message.author.id;

            const collector = message.channel.createMessageComponentCollector({
                filter,
                time: 20000,
            });

            collector.once('collect', (interaction) => {
                // Add the result
                let value = interaction.values[0];
                results[this.group] = value;

                interaction.update({
                    content: `Selected ${this.group
                        .split('_')
                        .join(' ')}: **${value}**`,
                    components: [],
                });
                collector.stop();

                // Invoke first method in chain and remove it from the array
                // Then pass in the new chain with the first element having been removed
                // This progresses the react-loop.
                chain.shift()(message, chain, results);
            });
        })();
    }
}

module.exports = MenuReactor;
