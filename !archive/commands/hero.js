const aliases = [
    ['quincy', 'q', 'cyberquincy', 'quincey', 'quinc', 'quonc', 'quonce', 'quoncy', 'cyber', 'furry', 'cq', 'uincy'],
    ['gwendolin', 'g', 'gwen', 'gwendolyn', 'gwendolyn', 'scientist', 'gwendolin', 'gwend', 'gwendo', 'fire'],
    ['striker-jones', 'sj', 'striker', 'bones', 'jones', 'biker', 'who'],
    ['obyn-greenfoot', 'obyn', 'greenfoot', 'o', 'ocyn'],
    ['captain-churchill', 'churchill', 'c', 'ch', 'chirch', 'church', 'captain', 'tank', 'winston', 'hill'],
    ['benjamin', 'b', 'dj', 'ben', 'benny', 'boi', 'best', 'benjammin', "benjammin'", 'yeet', 'boy'],
    ['ezili', 'e', 'ez', 'voodo', 'vm', 'ezi', 'ezil', 'voodoo'],
    ['pat-fusty', 'p', 'pat', 'pf', 'fusty', 'patfusty', 'frosty', 'snowman', 'fusticator', 'patfrosty', 'thicc'],
    ['adora', 'ad', 'ador', 'ado', 'dora', 'priestess', 'high', 'highpriestess'],
    ['admiral-brickell', 'brick', 'brickell', 'brickel'],
    ['etienne', 'etiene', 'french', 'etine', 'etinne', 'etenne', 'et', 'eti', 'drone'],
    ['sauda', 'saud', 'sau', 'sawdust', 'isabgirl'],
    ['psi', 'psy', 'Ψ', 'sigh'],
    ['geraldo', 'ger']
];
module.exports = {
    name: '<hero>',
    aliases: aliases.flat(),
    async execute(message) {
        return await message.channel.send(
            'Use `/hero`\nIf this does not show up on your server please re-add the bot using a new link: https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617'
        );
    }
};
