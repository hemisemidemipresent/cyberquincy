const Discord = require('discord.js')
const {prefix} = require('../config.json')
module.exports = {
	name: 'rc',
  aliases: ['rc','randomc','random','rchallenge','rch'],
	description: 'very epic thing inspired from https://unforgivenjake.github.io/btd6rc/',
	usage: '[command name]',
	cooldown: 5,
	execute(message, args) {
		if (args[0]==='help'){
			message.channel.send(`${prefix}rc <1 or 0, 1 means hero; 0 means no hero> <0 to 4: 0 is for random, 1 is for easy maps, 2 is for intermediate maps, 3 is for advanced and 4 is for expert> <0 to well.. any number: the start round for the challenge, 0 for random> <startround value and above: the end round for this challenge> <number of primary towers> <number of military towers> <number of magic towers> <number of support towers>`)
		}
		if (message.content===`${prefix}rc`){
			var heroyn = Math.floor(Math.random()*2)
			var mapdiff = 0
			var startround = 0
      var endround = 0
			var primarycount = Math.floor(Math.random()*5)
			var militarycount = Math.floor(Math.random()*5)
			var magiccount = Math.floor(Math.random()*3)
			var supportcount = Math.floor(Math.random()*2)
      var modeid = Math.ceil(Math.random()*10)
      var cashdefyn = 0
      var lives = 0
      var mkyn = Math.floor(Math.random()*2)
      var camoyn = Math.floor(Math.random()*2)
      var regrow = Math.floor(Math.random()*2)
      var sell = Math.floor(Math.random()*2)
      var cont = Math.floor(Math.random()*2)
      var powers = Math.floor(Math.random()*2)
		}if (message.content!==`${prefix}rc`){
      var heroyn = parseInt(args[0])//shows if the hero is included or not
		  var mapdiff = parseInt(args[1])//map diff
	  	var startround = parseInt(args[2])
		  var endround = parseInt(args[3])
		  var primarycount = parseInt(args[4])
		  var militarycount = parseInt(args[5])
		  var magiccount = parseInt(args[6])
		  var supportcount = parseInt(args[7])
      var modeid = parseInt(args[8])
      var cashdefyn = parseInt(args[9])
		}if(startround===0){
			var startround = Math.ceil(Math.random()*100)
		}if (endround===0){
			var endround = startround+Math.ceil(Math.random()*30)
		}if (endround<startround){
			return message.channel.send('your end round should be a higher number than the start round')
		}
		if(heroyn===0){
			var hero = 'none'
		}
		if (mapdiff===0){
			var mapdiff = Math.ceil(Math.random()*4)
		}
		if(heroyn===1){
			heroid = Math.ceil(Math.random()*8)
			switch(heroid){
				case 1: var hero = 'Quincy'
				break;
				case 2: var hero = "Gwendolyn"
				break;
				case 3: var hero = 'Obyn'
				break;
				case 4: var hero = 'Striker Jones'
				break;
				case 5: var hero = 'Pat Fusty'
				break;
				case 6: var hero = 'Benjamin'
				break;
				case 7: var hero = 'Ezili'
				break;
				case 8: var hero = 'Churchill'
				break;
			}
		}if (mapdiff===1){
			easymapid = Math.ceil(Math.random()*12)
			switch(easymapid){
				case 1: var map = 'monkey meadow'
				break;
				case 2: var map = 'tree stump'
				break;
				case 3: var map = 'town center'
				break;
				case 4: var map = 'alpine run'
				break;
				case 5: var map = 'frozen over'
				break;
				case 6: var map = 'in the loop'
				break;
				case 7: var map = 'cubism'
				break;
				case 8: var map = 'four circles'
				break;
				case 9: var map = 'hedge'
				break;
				case 10: var map = 'end of the road'
				break;
				case 11: var map = 'logs'
				break;
				case 12: var map = 'park path'
				break;
			}
		}if (mapdiff===2){
			easymapid = Math.ceil(Math.random()*11)
			switch(easymapid){
				case 1: var map = 'Spring Spring'
				break;
				case 2: var map = 'KartsNDarts'
				break;
				case 3: var map = 'Moon Landing'
				break;
				case 4: var map = 'Haunted'
				break;
				case 5: var map = 'Downstream'
				break;
				case 6: var map = 'Firing range'
				break;
				case 7: var map = 'cracked'
				break;
				case 8: var map = 'streambed'
				break;
				case 9: var map = 'Chutes'
				break;
				case 10: var map = 'Rake'
				break;
				case 11: var map = 'Spice islands'
				break;
			}
		}if (mapdiff===3){
			easymapid = Math.ceil(Math.random()*9)
			switch(easymapid){
				case 1: var map = 'spillway'
				break;
				case 2: var map = 'cargo'
				break;
				case 3: var map = 'pat\'s pond'
				break;
				case 4: var map = 'peninsula'
				break;
				case 5: var map = 'high finance'
				break;
				case 6: var map = 'another brick'
				break;
				case 7: var map = 'off the coast'
				break;
				case 8: var map = 'underground'
				break;
				case 9: var map = 'Cornfield'
				break;
			}
		}if (mapdiff===4){
			easymapid = Math.ceil(Math.random()*5)
			switch(easymapid){
				case 1: var map = 'workshop'
				break;
				case 2: var map = '#ouch'
				break;
				case 3: var map = 'muddy puddles'
				break;
				case 4: var map = 'quad'
				break;
				case 5: var map = 'Dark castle'
				break;
			}
		}
		var primary = ['dart','boomerang','bomb','tack','ice','glue']
		var primarycopy = [...primary]
		var primarygenerated = []
		for (i=0; i< primarycount ; i++ ){
			var ranprimaryindex = Math.floor(Math.random()* primarycopy.length)
			primarygenerated.push(primarycopy[ranprimaryindex])
			primarycopy.splice(ranprimaryindex, 1)
		}
		var primarymonkeys = primarygenerated.toString()
		if(primarygenerated.length===0){
			var primarymonkeys = ' '
		}

		//military
		var military = ['sub','boat','heli','ace','sniper','mortar']
		var militarycopy = [...military]
		var militarygenerated = []
		for (i=0; i< militarycount ; i++ ){
			var ranmilitaryindex = Math.floor(Math.random()* militarycopy.length)
			militarygenerated.push(militarycopy[ranmilitaryindex])
			militarycopy.splice(ranmilitaryindex, 1)
		}
		var militarymonkeys = militarygenerated.toString()
		if(militarygenerated.length===0){
			var militarymonkeys = ' '
		}
		//magic
		var magic = ['wizard','super','druid','alchemist','ninja']
		var magiccopy = [...magic]
		var magicgenerated = []
		for (i=0; i< magiccount ; i++ ){
			var ranmagicindex = Math.floor(Math.random()* magiccopy.length)
			magicgenerated.push(magiccopy[ranmagicindex])
			magiccopy.splice(ranmagicindex, 1)
		}
		
		var magicmonkeys = magicgenerated.toString()
		if(magicgenerated.length===0){
			var magicmonkeys = ' '
		}
		//support
		var support = ['farm',' spactory','engineer','village']
		var supportcopy = [...support]
		var supportgenerated = []
		for (i=0; i< supportcount ; i++ ){
			var ransupportindex = Math.floor(Math.random()* supportcopy.length)
			supportgenerated.push(supportcopy[ransupportindex])
			supportcopy.splice(ransupportindex, 1)
		}
		var supportmonkeys = supportgenerated.toString()
		
		if(supportgenerated.length===0){
			var supportmonkeys = ' '	
		}
		var modes = ['apopalypse','half cash','deflation','easy','medium','hard','impoppable','CHIMPS','double HP MOABs','ALternate Bloon Rounds']
		var mode = modes[modeid]
    var cash = 600 + 100*startround + startround*startround * Math.ceil(Math.random()*10)
    if (lives===0){
			var lives = Math.ceil(Math.random()*400)
		}
		if (mode==='impoppable'||mode==='CHIMPS'){
			var lives = 1
		}
    if (mkyn===1){
      var MK = 'disabled'
    }if (mkyn===0){
      var MK = 'enabled'
    }if (regrow===1){
      var grow = 'disabled'
    }if (regrow===0){
      var grow = 'enabled'
    }if (camoyn===1){
      var camo = 'disabled'
    }if (camoyn===0){
      var camo = 'enabled'
    }if (sell===1){
      var selling = 'disabled'
    }if (sell===0){
      var selling = 'enabled'
    }if (cont===1){
      var continues = 'disabled'
    }if (cont===0){
      var continues = 'enabled'
    }
		const ChallengeEmbed = new Discord.RichEmbed()
			.setTitle(`Random Challenge generated`)
			.setColor('#23dbb6')
			.addField('Map',`${map}`)
			.addField('Hero',`${hero}`)
      .addField('mode',`${mode}`)
      .addField('lives',`${lives}`)
      .addField('starting cash',`${cash}`)
			.addField('round',`${startround} to ${endround}`)
			.addField(`monkeys`,`${primarymonkeys},${militarymonkeys},${magicmonkeys},${supportmonkeys}`)
      .addField('other settings',` MK ${MK}, all regrow ${grow}, all camo ${camo}, seling ${selling}, continues ${continues}`)
			.setTimestamp()
			.addField('this command is still in beta','pls click [here](https://discord.gg/8agRm6c) to report bugs and and support')
		message.channel.send(ChallengeEmbed)
		
	},
}