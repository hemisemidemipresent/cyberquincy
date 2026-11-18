import Aliases from "../aliases";

import Colors from "../helpers/colors";

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { genCompletionLink, fetchIndex, orUnknown } from "../helpers/index";

const { red, palegreen } = Colors;

/** Values of the `modifier` option, which are also the API's `completiontype` values */
type LTCModifier = "cheapest" | "heroless" | "og";

let mapOption = new SlashCommandStringOption().setName("map").setDescription("Map").setRequired(true);

let comboModifierOption = new SlashCommandStringOption()
    .setName("modifier")
    .setDescription("LTC variant for the given map")
    .setRequired(false)
    .addChoices(
        { name: "Cheapest", value: "cheapest" },
        { name: "heroless", value: "heroless" },
        { name: "OG", value: "og" },
    );

const builder = new SlashCommandBuilder()
    .setName("ltc")
    .setDescription("Search and Browse Completed LTC Index Combos")
    .addStringOption(mapOption)
    .addStringOption(comboModifierOption);

async function execute(interaction: ChatInputCommandInteraction) {
    const map = Aliases.lookup(interaction.options.getString("map"), "map");
    if (!map) {
        return await interaction.reply("Map provided not valid");
    }

    await interaction.deferReply();

    // Discord restricts modifier to the choices above
    const modifier = interaction.options.getString("modifier") as LTCModifier | null;
    let challengeEmbed = await ltc(Aliases.toIndexNormalForm(map), modifier);
    return await interaction.editReply({ embeds: [challengeEmbed] });
}

// `map` is the map's index name, e.g. `Dark Castle`
async function ltc(map: string, modifier: LTCModifier | null): Promise<EmbedBuilder> {
    const searchParams = new URLSearchParams({ map, count: "100" });
    if (modifier) searchParams.set("completiontype", modifier);

    const { results } = await fetchltc(searchParams);
    const result = results[0];

    if (!result) {
        let desc = `No LTC found for ${map}`;
        if (modifier) desc = `No ${modifier} LTC found for ${map}`;
        return new EmbedBuilder().setTitle("Error!").setDescription(desc).setColor(red);
    }

    const challengeEmbed = new EmbedBuilder();

    challengeEmbed.setTitle(`${modifier ?? ""} ${map} LTC combo`);
    challengeEmbed.setColor(palegreen);

    for (let i = 0; i < result.towerset.length; i++) {
        challengeEmbed.addFields([
            { name: `Tower ${i + 1}`, value: `${result.towerset[i]} (${result.upgradeset[i]})`, inline: true },
        ]);
    }

    let link = genCompletionLink(result);

    challengeEmbed.addFields([
        { name: "Map", value: result.map, inline: true },
        { name: "Version", value: orUnknown(result.version), inline: true },
        { name: "Date", value: orUnknown(result.date), inline: true },
        { name: "Person", value: result.person, inline: true },
        { name: "Link", value: link, inline: true },
    ]);

    return challengeEmbed;
}

async function fetchltc(searchParams: URLSearchParams) {
    return await fetchIndex("ltc", searchParams);
}

export { builder as data, execute };
