const Discord = require("discord.js");
const quiz = require("../quiz.json");
module.exports = {
  name: "quiz",
  execute(message, args, client) {
    const item = quiz[Math.floor(Math.random() * quiz.length)];
    const QuestionEmbed = new Discord.RichEmbed()
      .setTitle("Welcome to **Who Wants To Be A Bloonionaire**")
      .setThumbnail(
        " https://vignette.wikia.nocookie.net/b__/images/4/4b/Bloonionaire.png/revision/latest?cb=20111201195001&path-prefix=bloons"
      )
      .addField(
        `${item.question}`,
        "type the option **letter** in chat\nyou will be given **10** seconds."
      )
      .addField("option a", `${item.optns[0]}`, true)
      .addField("option b", `${item.optns[1]}`, true)
      .addBlankField()
      .addField("option c", `${item.optns[2]}`, true)
      .addField("option d", `${item.optns[3]}`, true)
      .addField(
        "Suggest a question idea PLEASE",
        "suggest ideas [here](https://discord.gg/8agRm6c) or DM hnngggrrr#8734. [original game information](https://bloons.fandom.com/wiki/Who_Wants_To_Be_A_Bloonionaire%3F)"
      )
      .setFooter(
        "This command is unstable and dont expect it to be 100% working"
      );
    const filter = msg => msg.author.id === `${message.author.id}`;
    message.channel.send(QuestionEmbed).then(() => {
      message.channel
        .awaitMessages(filter, { maxMatches: 1, time: 10000, errors: ["time"] })
        .then(collected => {
          if (
            item.answers.toLowerCase() ===
            collected.first().content.toLowerCase()
          ) {
            message.channel.send(
              "Congratulations! You got the correct answer!"
            );
          } else {
            message.channel.send("Game over! You got the wrong answer!");
          }
        })
        .catch(collected => {
          message.channel.send(`Game over! You took too long.`);
        });
    });
  }
};
