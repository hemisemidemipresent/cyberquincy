const Discord = require("discord.js");
const { colour } = require("../config.json");
module.exports = {
  name: "map",
  description: "info about maps",
  aliases: ["m"],
  usage: "!map <map name with perfect spelling>",
  execute(message, args, client) {
    let map = args.join(" ");
    let name;
    if (
      map.includes("mm") ||
      (map.includes("monkey") && map.includes("meadow"))
    ) {
      name = "Monkey Meadows";
    } else if (map == "ts" || (map.includes("tree") && map.includes("stump"))) {
      name = "Tree Stump";
    } else if (
      map.includes("tc") ||
      (map.includes("town") && map.includes("cent"))
    ) {
      name = "Town Center";
    } else if (
      map.includes("pk") ||
      (map.includes("park") && map.includes("path"))
    ) {
      name = "Park Path";
    } else if (
      map.includes("alp") ||
      (map.includes("alpine") && map.includes("run"))
    ) {
      name = "Alpine Run";
    } else if (
      map.includes("fo") ||
      (map.includes("frozen") && map.includes("over"))
    ) {
      name = "Frozen Over";
    } else if (map.includes("itl") || map.includes("loop")) {
      name = "In The Loop";
    } else if (map.includes("cu")) {
      name = "Cubism";
    } else if (
      map.includes("fc") ||
      (map.includes("four") && map.includes("circles"))
    ) {
      name = "Four Circles";
    } else if (map.includes("hd") || map.includes("hedge")) {
      name = "Hedge";
    } else if (map.includes("log")) {
      name = "Logs";
    } else if (
      map.includes("eo") ||
      (map.includes("end") && map.includes("road"))
    ) {
      name = "End Of The Road";
    } else if (map.includes("ss") || map.includes("spring")) {
      name = "Spring Spring";
    } else if (
      map.includes("ka") ||
      (map.includes("darts") && map.includes("n"))
    ) {
      name = "KartsNDarts";
    } else if (
      map.includes("ml") ||
      (map.includes("moon") && map.includes("land"))
    ) {
      name = "Moon Landing";
    } else if (map.includes("hau")) {
      name = "Haunted";
    } else if (map.includes("down") || map.includes("downstream")) {
      name = "Downstream";
    } else if (
      map.includes("fr") ||
      (map.includes("fir") && map.includes("rang"))
    ) {
      name = "Firing Range";
    } else if (map.includes("cr")) {
      name = "Cracked";
    } else if (map.includes("sb") || map.includes("streambed")) {
      name = "Streambed";
    } else if (map.includes("chu")) {
      name = "Chutes";
    } else if (map.includes("ra")) {
      name = "Rake";
    } else if (
      map.includes("si") ||
      (map.includes("spi") && map.includes("is"))
    ) {
      name = "Spice Islands";
    } else if (map.includes("pat") && map.includes("pond")) {
      name = "Pat's Pond";
    } else if (map.includes("pe")) {
      name = "Peninsula";
    } else if (
      map.includes("hf") ||
      (map.includes("hi") && map.includes("f")) ||
      (map.includes("high") && map.includes("finance"))
    ) {
      name = "High Finance";
    } else if (
      map.includes("ab") ||
      (map.includes("another") && map.includes("brick"))
    ) {
      name = "Another Brick";
    } else if (
      map.includes("ot") ||
      (map.includes("off") && map.includes("coast"))
    ) {
      name = "Off The Coast";
    } else if (map.includes("co")) {
      name = "Cornfield";
    } else if (map.includes("un")) {
      name = "Underground";
    } else if (map.includes("qu")) {
      name = "Quad";
    } else if (
      map.includes("dc") ||
      (map.includes("dark") && map.includes("castle"))
    ) {
      name = "Dark Castle";
    } else if (
      map.includes("mp") ||
      (map.includes("muddy") && map.includes("puddles"))
    ) {
      name = "Muddy Puddles";
    } else if (map.includes("ou") || map.includes("#")) {
      name = "#Ouch";
    } else if (map.includes("cg") || map.includes("cargo")) {
      name = "Cargo";
    } else if (map.includes("cv") || map.includes("carved")) {
      name = "Carved";
    } else if (
      map.includes("bp") ||
      (map.includes("bloody") && map.includes("puddles"))
    ) {
      name = "Bloody Puddles";
    } else if (
      map.includes("at") ||
      (map.includes("ado") && map.includes("tem"))
    ) {
      name = "Adora's Temple";
    } else if (
      map.includes("wp") ||
      (map.includes("win") && map.includes("pa"))
    ) {
      name = "Winter Park";
    } else if (
      map.includes("sw") ||
      (map.includes("spi") && map.includes("way"))
    ) {
      name = "Spillway";
    } else if (
      map.includes("in") ||
      (map.includes("fe") && map.includes("na"))
    ) {
      name = "Infernal";
    } else if (
      map.includes("gea") ||
      (map.includes("gd") && map.includes("red"))
    ) {
      name = "Infernal";
    } else {
      return message.channel.send(
        "cant seem to find that map. might want to check the spelling.\nThere are 43 maps in the game\n79% of maps include water\n57% of maps include L.O.S obstructions\n50% of maps include objects"
      );
    }
    const ma = require("../map.json");
    let m = ma[`${name}`];
    let thum = m.thu;
    if (!thum) {
      thum =
        "https://vignette.wikia.nocookie.net/b__/images/0/0c/QuincyCyberPortraitLvl20.png/revision/latest/scale-to-width-down/179?cb=20190612022025&path-prefix=bloons";
    }
    const mapEmbed = new Discord.RichEmbed()
      //.setColor(colour)
      .setTitle("Map info")
      .setAuthor("Cyber Quincy")
      .setDescription(`Here is your info for ${name}`)
      .setThumbnail(`${thum}`)
      .addField("Map length(RBS)", `${m.len}`, true)
      .addField("Object count:", `${m.obj}`, true)
      .addField("Total $ to clear out all the objects", `$${m.Cos}`, true)
      .addField("Version added:", `${m.ver}`, true)
      .addField("Water body percentage", `${m["wa%"]}`, true)
      //.addField('Line of sight obstructions', `${m.los}`, true)
      .addField(
        "Bug reporting",
        "report [here](https://discord.gg/8agRm6c)",
        true
      )
      .setFooter(
        "I am Quincy, Evolved from quincy.",
        "https://vignette.wikia.nocookie.net/b__/images/0/0c/QuincyCyberPortraitLvl20.png/revision/latest/scale-to-width-down/179?cb=20190612022025&path-prefix=bloons"
      )
      .setColor(colour);
    message.channel.send(mapEmbed);
  }
};
