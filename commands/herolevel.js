const AnyOrderParser = require('../parser/any-order-parser.js');
const OptionalParser = require('../parser/optional-parser.js');

const HeroParser = require('../parser/hero-parser.js');
const RoundParser = require('../parser/round-parser');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');

const ReactionChain = require('../reactor/reaction_chain');
const EmojiReactor = require('../reactor/emoji_reactor');
const SingleTextParser = require('../reactor/single_text_parser');

const Heroes = require('../helpers/heroes')

function execute(message, args) {
    if (args.length == 1 && args[0] == 'help') {
        return message.channel.send(
            'Type `q!herolevel` and follow the instructions (you may also want to try `q!herolevelby`)'
        );
    }

    const parsed = CommandParser.parse(
        args,

        // Make any of the available arguments optional to add in any order in the command args
        // Arguments that aren't entered will be gathered through the react-loop
        new AnyOrderParser(
            new OptionalParser(new HeroParser()),
            new OptionalParser(new RoundParser('ALL')),
            new OptionalParser(new MapDifficultyParser())
        )
    );

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors);
    }

    // Start react loop to collect the data that the user didn't provide at command-time
    ReactionChain.process(
        message,
        (message, results) => displayHeroLevels(message, results),
        new EmojiReactor('hero', Guilds.EMOJIS_SERVER, parsed.hero),
        new SingleTextParser(new RoundParser('ALL'), 'starting', parsed.round),
        new EmojiReactor(
            'map_difficulty',
            Guilds.EMOJIS_SERVER,
            parsed.map_difficulty
        )
    );
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!herolevel help` for help', '\u200b')
        .setColor(colours['orange']);

    return message.channel.send(errorEmbed);
}

function displayHeroLevels(message, results) {
    heroLevels = calculateHeroLevels(
        results.hero,
        results.starting_round,
        results.map_difficulty
    );
    let res = table(h.range(1, 20), heroLevels.slice(1));
    const embed = new Discord.MessageEmbed()
        .setTitle(`${h.toTitleCase(results.hero)} Leveling Chart`)
        .setDescription(
            `Placed: **R${results.starting_round}**\nMaps: **${h.toTitleCase(
                results.map_difficulty
            )}**`
        )
        .addField('\u200b', `${res}`)
        .setColor(colours['cyber']);

    message.channel.send(embed);
}

// Once the hero leveling chart is built up, each leveling array is collapsed each into a single value that is
// the lowest index (which represents the round) where the value (which represents the cost the level up)
// is 0 or less, meaning the level has already been reached.
function calculateHeroLevels(hero, startingRound, mapDifficulty) {
    heroLevelingChart = Heroes.levelingChart(hero, startingRound, mapDifficulty)

    roundForLevelUpTo = [0, startingRound].concat(
        // Levels 0 and 1
        // Take the levelCostArray for level 2-20...
        heroLevelingChart.slice(2).map((levelCostArray) => {
            // Find the first level at which the cost to level the hero up is 0 or less
            levelOrNotFound = levelCostArray.findIndex((cost) => cost <= 0);
            return levelOrNotFound == -1 ? '>100' : levelOrNotFound;
        })
    );

    return roundForLevelUpTo;
}

module.exports = {
    name: 'herolevel',
    aliases: ['hl', 'hero', 'her', 'hlvl'],
    execute,
};

function addSpaces(str, max) {
    let diff = max - str.toString().length;

    for (i = 0; i < diff; i++) str += ' ';

    return str;
}

function table(lvl, round) {
    let finalRes = '`level`|`round`\n';
    let i = 0;
    while (i < 20) {
        // for loop doesnt work here due to black arcane magic
        res = '';
        res += `\`${addSpaces(lvl[i], 5)}`;
        res += '|';
        res += `${addSpaces(round[i], 5)}\``;
        finalRes += res;
        finalRes += '\n';
        i++;
    }
    return finalRes;
}
