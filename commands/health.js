
module.exports = {
	name: 'health',
	aliases: ['h'],
	description: 'calculates the health of blimps, even in freeplay',
	usage:'!health <bloon> <round>',
	execute(message, args, client) {
		//rounds
		const b = args[0].toUpperCase();
		var round = args[1];
		var round1 = round-80;
		var round2 = round-100;
		var round3 = round-125;
		var round4 = round-152;
		if (b === 'MOAB'){
			var bloon = 200;
		}else if (b === 'BFB'){
			var bloon = 700;
		}else if (b === 'ZOMG'){
			var bloon = 4000;
		}else if (b === 'DDT'){
			var bloon = 400;
		}else if (b === 'BAD'){
			var bloon = 20000;
		}else{
      return message.channel.send('please specify a blimp, e.g. ZOMG')
    }
		//multiplier
		var m1=0.02*round1;
		var m2=0.05*round2;
		var m3=0.2*round3;
		var m4=0.5*round4;
		//percentage increase
		if (round>80&&round<101){
			var pi=1+m1;         //80 to 100
		}else if (round>100&&round<125){		//100 to 125
			var pi=1+m2+0.4;
		}else if (round>124&&round<152){		//125 to 152
			var pi=1+m3+0.4+1.25;
		}else if (round>151){
			var pi=1+m4+0.4+1.25+5.4;
		}
		var bhealth = Math.floor(bloon*pi);
		
		if (args[0] === 'moab'||args[0] === 'MOAB'){
			var recognisable = 1
		}else if (args[0] === 'bfb'||args[0] === 'BFB'){
			var recognisable = 1
		}else if (args[0] === 'zomg'||args[0] === 'ZOMG'){
			var recognisable = 1
		}else if (args[0] === 'ddt'||args[0] === 'DDT'){
			var recognisable = 1
		}else if (args[0] === 'bad'||args[0] === 'BAD'){
			var recognisable = 1
		}else {
			var recognisable=0
		}
		
		if (round>80&&recognisable===1){
			return message.channel.send(`${bhealth} pops are needed to pop this blimp (not including children)`);
		}else if (round<1){
			return message.channel.send('quincy has no experience in these rounds');
		}else if (round>0&&round<81){
			return message.channel.send(`${bloon}`);
		}else{
			if (args[0] === 'moab'||args[0] === 'MOAB'){
				return message.channel.send(`${bloon}.`);
			}else if (args[0] === 'bfb'||args[0] === 'BFB'){
				return message.channel.send(`${bloon}`);
			}else if (args[0] === 'zomg'||args[0] === 'ZOMG'){
				return message.channel.send(`${bloon}`);
			}else if (args[0] === 'ddt'||args[0] === 'DDT'){
				return message.channel.send(`${bloon}`);
			}else if (args[0] === 'bad'||args[0] === 'BAD'){
				return message.channel.send(`${bloon}`);
			}else{
				message.channel.send('hmm... something went wrong. perhaps you inputted a wrong statement, or misspelled something. if problem persists, join the bot support server:var recognisable = 1')
			}
		}if (args[0]==='test'){
			message.channel.send(`${timesused}`)
		}
		
	},
};
