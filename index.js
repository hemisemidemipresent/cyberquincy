const http = require("http");
const express = require("express");
const app = express();
app.use(express.static("public"));
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
const p = require("./package.json");
const version = p.version;
const fs = require("fs");
const Discord = require("discord.js");
const Sequelize = require("sequelize");
const { prefix, colour, token } = require("./config.json");
const client = new Discord.Client();
var noocmd = /noo+cmd/i;
client.commands = new Discord.Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}
const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: "database.sqlite"
});
const Tags = sequelize.define("tags", {
  name: {
    type: Sequelize.STRING,
    unique: true
  },
  xp: Sequelize.INTEGER,
  level: Sequelize.INTEGER
});
const cooldowns = new Discord.Collection();
client.once("ready", () => {
  Tags.sync();
  console.log("<Program Directive>");
  function too() {
    console.log("<Eradicate Bloons>");
  }
  setTimeout(too, 1000);
  function three() {
    console.log("<INITIATE>");
  }
  setTimeout(three, 2000);
  client.user.setActivity(`${prefix}help for help.`);
});
client.on("guildCreate", guild => {
  var channeltosend = guild.channels.find(
    channel => channel.name.includes("general") === true
  );
  if (channeltosend === null) {
    return console.log("wtf");
  } else {
    const helpembed = new Discord.RichEmbed()
      .setColor(colour)
      .setDescription(`Hi! I am Cyber Quincy. I am a btd6 bot.`)
      .addField(
        "general information:",
        "[List of commands](https://docs.google.com/document/d/1NJqQ82EUP6yTri1MV63Pbk-l_Lo_WKXCndH7ED8retY/edit?usp=sharing)\n[support server](https://discord.gg/8agRm6c)"
      )
      .addField(
        "Please note that this bot's name and avatar are owned by ninja Kiwi. This bot has no association with them."
      )
      .addField(
        `use ${prefix}help <command name> for help on that command`,
        `use ${prefix}info for more information`
      )
      .setFooter("have a popping day");
    channeltosend.send(helpembed);
  }
});
client.on("guildMemberAdd", member => {
  const helpembed = new Discord.RichEmbed()
    .setColor(colour)
    .setTitle("Welcome to **Cyber Quincy Bot Support**! Thank you for joining!")
    .setDescription(
      `Hi! I am Cyber Quincy, a bot made by hnngggrrrr#8734. for more information, type ${prefix}help`
    )
    .addField(
      "if you are experiencing an error:",
      "check with <#615159685477040135>, <#616603947481694209> or <#605712758595649566>."
    )
    .addField(
      "if you think that there is a bug:",
      "go to <#598768319625035776> and please tell us what went wrong. If you have any questions on how to use this bot, go to <#611808489047719937>. if you have a suggestion, please let us know in <#598768278550085633>"
    )
    .addField(
      "general information:",
      "[List of commands](https://docs.google.com/document/d/1NJqQ82EUP6yTri1MV63Pbk-l_Lo_WKXCndH7ED8retY/edit?usp=sharing)\n[support server](https://discord.gg/8agRm6c), join for updates and important uptimes and downtimes"
    )
    .addField(
      "Please note that this bot's name and avatar are owned by ninja Kiwi. This bot has no association with them.",
      "have a popping day"
    )
    .addField(
      `use ${prefix}info for more information`,
      "this bot was made by hnngggrrrr#8734"
    );
  if (member.guild.id === "598768024761139240") {
    const tchannel = member.guild.channels.find(channel =>
      channel.name.includes("welcome")
    );
    tchannel.send(
      `Welcome to the server, **${member.displayName}**. Please check the DM for more information, and read <#605712758595649566>. Thanks for joining, and you are our **${member.guild.memberCount}**th member!`
    );

    member.send(helpembed);
  } else if (member.guild.id === "543957081183617024") {
    const tchannel = member.guild.channels.find(channel =>
      channel.name.includes("general")
    );
    tchannel.send(`welcome to the only rAcE sErVer`);
  }
});
client.on("guildMemberRemove", member => {
  if (member.guild.id === "598768024761139240") {
    const tchannel = member.guild.channels.find(channel =>
      channel.name.includes("welcome")
    );
    tchannel.send(`Goodbye, **${member.displayName}**`);
  } else if (member.guild.id === "543957081183617024") {
    const tchannel = member.guild.channels.find(channel =>
      channel.name.includes("general")
    );
    tchannel.send(
      `${member.displayName} gave up on races and decided to watch sjb instead`
    );
  }
});
//messGAE
client.on("message", async message => {
  if (message.content.startsWith("29999")) {
    message.channel.send("give nitro to him\n|\nv");
  }
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();
  if (commandName == "level") {
    if(message.mentions!==undefined){
      let mentions = message.mentions.members.array();
      let id = mentions[0].id;
      try{
        const tagg = await Tags.findOne({ where: { name: id } });
        return message.channel.send(`level : ${tagg.level}\n xp: ${tagg.xp}`);
      }catch(e){
        console.log(e);
        const errorEmbed = new Discord.RichEmbed()
        .setColor(colour)
        .addField(
          "something went wrong",
          "Please join the [support server](https://discord.gg/8agRm6c)"
        );
      message.reply(errorEmbed);
      }
    }
    const tagg = await Tags.findOne({ where: { name: message.author.id } });
    message.channel.send(`level : ${tagg.level}\n xp: ${tagg.xp}`);
  }
  if (commandName === "info") {
    const apiPing = Math.round(message.client.ping);
    const responseTime = Math.round(Date.now() - message.createdTimestamp);
    let totalSeconds = client.uptime / 1000;
    let days = Math.floor(totalSeconds / 86400);
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let uptime = `${days} days, ${hours} hours, and ${minutes} minutes`;
    const infoEmbed = new Discord.RichEmbed()
      .setColor("#23dbb6")
      .setTitle("access help here")
      .setURL("https://discord.gg/8agRm6c")
      .setDescription(
        `Cyber Quincy is battling ${client.guilds.size} waves of bloons and training ${client.users.size} monkeys`
      )
      .addField(
        "ping:",
        `API ping ${apiPing}\nResponse time: ${responseTime}ms`,
        true
      )
      .setThumbnail(
        "https://vignette.wikia.nocookie.net/b__/images/d/d3/QuincyCyberPortrait.png/revision/latest?cb=20190612021929&path-prefix=bloons"
      )
      .addField("time since last restart:", `${uptime}`, true)
      .addField("version running", `${version}`)
      .addField("bot developer:", "hnngggrrrr#8734", true)
      .addField(
        "bot invite link",
        "https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=805432400"
      )
      .addField(
        "commands list",
        " https://docs.google.com/document/d/1NJqQ82EUP6yTri1MV63Pbk-l_Lo_WKXCndH7ED8retY/edit?usp=sharing",
        true
      )
      .addField(
        "support server, join for updates (happens pretty often)",
        "https://discord.gg/8agRm6c",
        true
      )
      .setFooter("thank you for using it! waiting for NK's approval");
    message.channel.send(infoEmbed);
  }
  /*if(commandName=='edit'&&message.channel.id=='643773699916431361'){
		const h = require('./heroes.json')
		h['churchill'][args[0]].cost = args[1]*1.2
		h['ben'][args[0]].cost = args[1]
		fs.writeFile('./heroes.json',JSON.stringify(h),(err)=>{
            if(err)console.log(err)
        })
		
	}*/

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      cmd => cmd.aliases && cmd.aliases.includes(commandName)
    );
  if (!command) return;
  //cooldown
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;
  if (
    timestamps.has(message.author.id) &&
    noocmd.test(message.channel.topic) === false
  ) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `please wait ${timeLeft.toFixed(
          1
        )} more second(s) before reusing the \`${command.name}\` command.`
      );
    }
  }
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  if (noocmd.test(message.channel.topic) === false) {
    try {
      command.execute(message, args);
      let xpAdd = Math.floor(Math.random() * 8) + 5;
      let guildmember = message.member;
      try {
        // equivalent to: INSERT INTO tags (name, description, username) values (?, ?, ?);
        const tag = await Tags.create({
          name: message.author.id,
          xp: 0,
          level: 1
        });
        return message.reply(`xp added.`);
      } catch (e) {
        if (e.name === "SequelizeUniqueConstraintError") {
          const tag = await Tags.findOne({
            where: { name: message.author.id }
          });
          const affectedRows = await Tags.update(
            { xp: tag.xp + xpAdd },
            { where: { name: message.author.id } }
          );
          if (affectedRows > 0) {
            const tag1 = await Tags.findOne({
              where: { name: message.author.id }
            });
            if (tag1.xp > tag1.level * 100) {
              const affectedRows1 = await Tags.update(
                { level: tag1.level + 1 },
                { where: { name: message.author.id } }
              );
              let ran = Math.floor(Math.random() * 8);
              switch (ran) {
                case 0:
                  var ltxt = "Haha!";
                  break;
                case 1:
                  var ltxt = "Ha!";
                  break;
                case 2:
                  var ltxt = "Oh Yeah!";
                  break;
                case 3:
                  var ltxt = "Alright!";
                  break;
                case 4:
                  var ltxt = "Sweet!";
                  break;
                case 5:
                  var ltxt = "Yes!";
                  break;
                case 6:
                  var ltxt = "Nice!";
                  break;
                case 7:
                  var ltxt = "Awesome!";
              }
              message.channel.send(
                `${ltxt} you advanced to level ${tag1.level}`
              );
              if (tag1.level == 3) {
                guildmember.addRole("645126928340353036");
              }
              if (tag1.level == 10) {
                guildmember.addRole("645629187322806272");
              }
            }
            return 
          }
        }
        const errorEmbed = new Discord.RichEmbed()
          .setColor(colour)
          .addField(
            "Oops! something went wrong!",
            "Please join the [support server](https://discord.gg/8agRm6c)"
          );
        return message.reply(errorEmbed);
      }
    } catch (error) {
      console.error(error);
      const errorEmbed = new Discord.RichEmbed()
        .setColor(colour)
        .addField(
          "something went wrong",
          "Please join the [support server](https://discord.gg/8agRm6c)"
        );
      message.reply(errorEmbed);
    }
  }
});
client.login(token);
