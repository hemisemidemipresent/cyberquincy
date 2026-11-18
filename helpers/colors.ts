import type { HexColorString } from "discord.js";
import colors from "../jsons/colors.json";

// JSON values are typed as plain strings; discord.js needs to know they are "#rrggbb" hex strings
export default colors as Record<keyof typeof colors, HexColorString>;
