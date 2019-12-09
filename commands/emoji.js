const Discord = require("discord.js");
const { colour } = require("../config.json");
module.exports = {
  name: "emote",
  description: "emojis",
  aliases: ["emoji"],
  usage: "<path1> <path2> <path3>",
  execute(message, args) {
    message.delete();
    if (!args) {
      return message.channel.send("q!emoji help");
    }
    if (args[0] == "all") {
      let emojisGuild = message.guild.emojis.array().join(" ")
  let emojisArray = Discord.splitMessage(emojisGuild, { maxLength: 1024, char: " " });
  if (typeof emojisArray === "string") emojisArray = [emojisArray];
  
    const embed = new Discord.RichEmbed()
      .setTitle(
        "There Are " +
          message.guild.emojis.size +
          " Emojis on " +
          message.guild.name
      )
      .setColor(0xffff40)
      .setDescription("These Are All The Emojis:")
      .setThumbnail(message.guild.iconURL);
    emojisArray.forEach((emojis, i) => {
      embed.addField(`Page ${i + 1}:`, emojis);
    });
    message.channel.send(embed);
    }
    if (args[0] == "supermonkey") {
      if (args[1] == "happy") {
        message.channel.send("<a:Supermonkey_Happy:408048296154628096>");
      } else if (args[1] == "sleep") {
        message.channel.send("<a:Supermonkey_Sleepy:408048528146038784>");
      } else if (args[1] == "dizzy") {
        message.channel.send("<a:Supermonkey_Dizzy:429614433019494410>");
      } else if (args[1] == "cry") {
        message.channel.send("<a:Supermonkey_Cry:429614578746261504>");
      } else if (args[1] == "eyebrows") {
        message.channel.send("<a:Supermonkey_Eyebrows:429614648724291605>");
      }
      //message.channel.send('<a:Supermonkey_Happy:408048296154628096>\n<a:Supermonkey_Sleepy:408048528146038784>\n<a:Supermonkey_Dizzy:429614433019494410>\n<a:Supermonkey_Cry:429614578746261504>\n<a:Supermonkey_Eyebrows:429614648724291605>')
    } else if (args[0].includes("dr")) {
      if (args[1] == "nod") {
        message.channel.send("<a:DrMonkey_Nod:429614777833226251>");
      } else if (args[1] == "shake") {
        message.channel.send("<a:DrMonkey_Shake:429614787345776650>");
      }
    } else if (args[0].includes("crouch")) {
      message.channel.send("<a:Crouching_Ninja:408047841563377664>");
    } else if (args[0] == "bfb") {
      message.channel.send(
        "<a:rohan:408044760331452416><a:rohan2:408045435005960204>"
      );
    } else if (args[0] == "cry") {
      message.channel.send("<a:cry:644398761409511434>");
    } else if (args[0] == "wink") {
      message.channel.send("<a:wink:647313341340975108>");
    } else if (args[0] == "ben") {
      message.channel.send("<a:ben:647819957861744718>");
    } else if (args[0] == "thonk") {
      message.channel.send("<a:dartythonk:647819976102641702>");
    } else if (args[0] == "no") {
      message.channel.send("<a:no:647819990447292457>");
    } else if (args[0] == "yes") {
      message.channel.send("<a:yes:647820009493626892>");
    } else if (args[0] == "pink") {
      message.channel.send(
        "<a:pink1:647821652218085376> <a:pink2:647821634408939531> <a:pink3:647821621708587019>"
      );
    } else if (args[0] == "marine") {
      message.channel.send(
        "<a:m1:648343849973841923><a:m2:648341891015901185><a:m3:648341904705978386><a:m4:648341917804789821>\n<a:m5:648343886032404481><a:m6:648343901576364052><a:m7:648343914008543262><a:m8:648343935068012544>\n<a:m9:648343952138960896><a:m10:648343967615942687><a:m11:648343979967905803><a:m12:648343991594778634>\n<a:m13:648344004148330507><a:m14:648344017850990605><a:m15:648344035601285121><a:m16:648344048918331392>"
      );
    } else if (args[0] == "help") {
      const helpembed = new Discord.RichEmbed()
        .setTitle("Emoji help page")
        .setDescription("how to use it:\nthere are 2 types of text here")
        .addField("top text", "bottom text")
        .addField(
          "usage:",
          "q!emoji ``<top text>`` ``<bottom text>``(select **one** bottom text)\n**e.g.q!emoji supermonkey happy**"
        )
        .addField("supermonkey", "happy,sleep,dizzy,cry,eyebrows", true)
        .addField("drmonkey", "nod,shake", true)
        .addField("**crouch**", "(just use q!emoji crouch)", true)
        .addField("**bfb**", "again, just use ``q!emoji bfb``", true)
        .addField("**cry**", "just like the previous", true)
        .addField("**ben**", "just like the previous", true)
        .addField("**thonk**", "just like the previous", true)
        .addField("**no**", "just like the previous", true)
        .addField("**yes**", "just like the previous", true)
        .addField("**marine**", "do i need to state the obvious?", true)
        .addField("**pink**", "come on", true)
        .setFooter("your message will be deleted");
      message.channel.send(helpembed);
    }
  }
};
