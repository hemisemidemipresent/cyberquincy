const Discord = require('discord.js')
const {colour} = require('../config.json')
module.exports = {
    name: 'ap',
    description:'tells you about the abr rounds (below 100 cos freeplay abr is the same as normal)',
    aliases:['popology'],
    usage:'!abround <round>',
    execute(message,args){
		if(!args.length){
			const choosemebed = new Discord.RichEmbed()
			.setTitle('What can i help you with?')
			.setDescription('use **q!ap <question number>**. \ne.g. ``q!ap 1`` will answer question 1')
			.addField('1','I dont understand what s,d,p,md,fd,cd,j,etc... means')
			.addField('2','i dont understad what is \'normal type\',\'sharp type\',etc... is')
			.addField('3','i dont understand buffs')
			.setColor(colour)
        	return message.channel.send(choosemebed)
		}
		if(args[0]==1){
			if(args[1]=='d'){
				const damageembed = new Discord.RichEmbed()
				.setTitle('Damage')
				.setDescription('the amount of health a single attack removes. Because most bloons have only 1 health, any excess damage is (usually) carried over to the children spawned. If damage is not passed on to child bloons, it will be qualified with "up to".')
				.addField('Layers','"Layers" is sometimes used in in-game descriptions to mean damage. This is misleading, as most people would consider eg a ceramic to have 1 more layer than a rainbow, but it requires 10 damage to remove this layer.')
				.setColor(colour)
				message.channel.send(damageembed)
			}else if(args[1]=='md'||args[1]=='cd'||args[1]=='fd'){
				const additionaldamageEmbed = new Discord.RichEmbed()
				.setTitle('Some attacks do additional damage to ceramic bloons, MOAB-class bloons, or fortified bloons.')
				.setDescription('These will be indicated by cd, md, and fd respectively, and the total damage will be written in parentheses for convenience, eg "2d, 1md (3)". Other bonuses are possible, but will not be abbreviated due to how uncommon they are.')
				.setColor(colour)
				message.channel.send(additionaldamageEmbed)
			}else if(args[1]=='p'){
				const pierceembed = new Discord.RichEmbed()
				.setTitle('Pierce')
				.setDescription('Pierce (p) is the number of different targets a single projectile can hit. The exact meaning of pierce depends on the attack\'s behaviour.')
				.addField('behavious','Possible behaviours (this is not an official term, nor has this concept been mentioned by anyone official):')
				.addField('Default','projectiles continue travelling along some path (usually a straight line), until either the pierce has been used up or the projectile\'s lifespan expires.', true)
				.addField('impact','projectiles have no meaningful concept of pierce, and usually create an effect (eg an explosion) as soon as they hit something instead of dealing damage directly.',true)
				.addField('Zone','no projectile, anything in range up to the pierce limit takes damage.',true)
				.setFooter('"Popping power" is a vague term and is best avoided entirely. Despite this, in-game descriptions continually use it to mean pierce.')
				.setColor(colour)
				message.channel.send(pierceembed)
			}else if(args[1]=='r'){
				const rangeembed = new Discord.RichEmbed()
				.setTitle('Range (r)')
				.setDescription('Range (r) is the radius of the range circle, given in arbitrary "units", because pixel values depend entirely on the resolution of the device running the game. While it is hard to imagine what a "unit" is, providing these numbers does allow for very useful comparisons between towers.')
				.setColor(colour)
				message.channel.send(rangeembed)
			}else if(args[1]=='s'){
				const sembed = new Discord.RichEmbed()
				.setTitle('Seconds per attack (s)')
				.setDescription('Attack speed, or more precisely "attacks per second" is never referred to directly, only "seconds per attack" (s), more commonly referred to as a "cooldown" or a "reload". One value can be found from the other by taking the reciprocal (1 divided by it). For example, "0.4s" would mean "one attack every 0.4 seconds", and the speed is then 1/0.4 = 2.5 attacks per second.')
				.addField('Reload times greater than 0.1s','they are only accurate to the nearest frame (1/60th of a second). Times less than 0.1s are accurate on average - towers will release multiple projectiles on the same frame as necessary to maintain this average.')
				.setColor(colour)
				message.channel.send(sembed)
			}else if(args[1]=='j'){
				const jembed = new Discord.RichEmbed()
				.setTitle('Projectile count (j)')
				.setDescription('Projectile count is quite simply the number of projectiles emitted at once. If the count is not 1, it will be stated with the abbreviation **j**. No attempt will be made to describe how spread out the projectiles are (compare tack shooter to triple darts).')
				.setColor(colour)
				message.channel.send(jembed)
			}else{
				const mainpropembed = new Discord.RichEmbed()
					.setTitle('which of the following letters do you not understand?')
					.setDescription('use **q!ap 1 <whichever funny letter you want elaboration>** from the list below:')
					.addField('**d**','Damage',true)
					.addField('**md**/**cd**/**fd**','MOAB-class bloon Damage/ceramic damage/fortified bloon damage',true)
					.addField('**p**','Pierce',true)
					.addField('**r**','range',true)
					.addField('**s**','seconds per attack/cooldown/reload',true)
					.addField('**j**','projectile count',true)
					.setColor(colour)
					message.channel.send(mainpropembed)
			}
		}
		else if(args[0]==2){
			const typembed = new Discord.RichEmbed()
			.setImage('https://cdn.discordapp.com/attachments/594348433922457610/646631295346278412/Screenshot_70.png')
			.addField('Attacks can have special effects other than dealing damage, which may be triggered in one of several ways:','hitting but not necessarily damaging a target ("on hit")\ndamaging a target ("on damage")\ndelivering the final hit on a target ("on pop")\nthe projectile simply expiring ("on expire")')
			.addField('some common effects','removing camo status ("decamo")\nremoving regrow status ("degrow")\nremoving fortified status ("defort") — this halves (or quarters for lead) the health of a fortified target, rounding down\ncreating explosions\nemitting more projectiles\napplying a status (such as glue or burn) to the target')
			.addField('towers','A tower can have any number of attacks, with completely independent values for all of the above stats. The range for a secondary attack is usually the same as the main attack, and so is omitted in this case.')
			.addField('Most attacks are active','they aim at a particular bloon, which is usually possible to influence by changing the tower\'s targeting option. Furthermore, some of them can only target certain types of bloon - most obvious example is camo bloons, but also some attacks can only see blimps, or cannot see blimps, or all blimps except BAD, etc.On the other hand, a passive attack happens regardless of any bloons, such as placing something on the track.')
			.setFooter('This is not enough to fully describe all attacks! There are many special cases that simply need more words.')
			.setColor(colour)
			message.channel.send(typembed)
		}else if(args[0]=3){
			const buffembed = new Discord.RichEmbed()
			.setTitle('Buffs, Unless explicitly stated, buffs from the same source (ie another tower with the same upgrade), do not stack.')
			.setDescription('Additive buffs will be indicated with a + symbol. For convenience, the new value (excluding buffs from crosspathing or other sources) is written in parentheses like so: "+1d (2)".\nMultiplicative buffs will be indicated with × or %, depending on which is most appropriate.\nAll additive buffs apply before any multiplicative buffs.')
			.addField('extra effects','If an attack creates any extra effects, they are also affected by damage and pierce buffs that applied to the attack that created them.')
			.addField('0 dmg attacks','If an attack has 0 damage, it is completely unaffected by any damage buffs. This even applies to attacks with 0 damage but nonzero ceramic/MOAB damage (although super glue is probably the only example of this).')
			.addField('impact','Impact projectiles are completely unaffected by pierce buffs, it is always effectively 1. Effects can still inherit the buff.')
			.addField('buffs to speed','Buffs to speed in fact work by decreasing the reload time, instead of increasing the speed directly. These are different: a 20% buff to the reload, ie multiplying it by 0.8, is equivalent to multiplying the speed by 1/0.8 = 1.25×, so a 25% buff to the speed. Numbers in in-game descriptions usually mean a reload buff, which can be slightly misleading.\nThe new reload time will be expressed as a percentage of the current reload, so a 20% buff to an attack with 1.5s reload will be written "80%s (1.2)". Another 20% buff later in the same upgrade path will be written "80%s (0.96)".')
			.setFooter('If an upgrade adds or replaces an attack, the new attack will not be affected by buffs from earlier in the same path.')
			.setColor(colour)
			message.channel.send(buffembed)
		}else{
			message.channel.send('I cant understand what you are saying!')
		}
			
    }
}