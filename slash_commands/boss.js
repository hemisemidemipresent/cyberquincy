const { SlashCommandBuilder } = require('discord.js'),
  gHelper = require('../helpers/general.js');

const { Bloonarius, Lych, Vortex } = require('../jsons/boss.json');

const builder = new SlashCommandBuilder()
  .setName('boss')
  .setDescription('Find information for boss blimps')
  .addStringOption(option =>
    option
      .setName('name')
      .setDescription('Which boss it is')
      .addChoices(
        { name: 'Bloonarius', value: 'bloonarius' },
        { name: 'Gravelord Lych', value: 'lych' },
        { name: 'Vortex: Deadly Master of Air', value: 'vortex' },
      )
      .setRequired(true),
  )
  .addIntegerOption(option =>
    option.setName('tier').setDescription('Tier of the boss').setRequired(true).setMaxValue(5).setMinValue(1))
  .addBooleanOption(option =>
    option.setName('elite').setDescription('Whether the boss is elite or not').setRequired(true),
  );

function execute(interaction) {
  const tier = interaction.options.getInteger('tier'),
    boss = interaction.options.getString('name'),
    isElite = interaction.options.getBoolean('elite');

  let embed;
  switch (boss) {
    case 'bloonarius':
      embed = process(Bloonarius, 'Bloonarius', tier, isElite);
      break;
    case 'lych':
      embed = process(Lych, 'Lych', tier, isElite);
      break;
    case 'vortex':
      embed = process(Vortex, 'Vortex', tier, isElite);
      break;
  }
  return interaction.reply({ embeds: [embed] });
}

function process(data, name, tier, isElite) {
  const obj = isElite ? data.elite[tier - 1] : data.normal[tier - 1];
  let desc = `${data.desc}\n${isElite ? data.eliteDesc : normalDesc}\n\n**Stats**:
Health: ${gHelper.numberWithCommas(obj.hp)}
Speed: ${obj.speed} rbs/s
${obj.desc}
\`\`\`${data.customRounds}\`\`\``;
  return new Discord.EmbedBuilder().setTitle(`${isElite ? 'Elite' : ''} ${name} Tier ${tier}`).setDescription(desc);
}

module.exports = {
  data: builder,
  execute,
};
