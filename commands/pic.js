const Discord = require('discord.js');
const {prefix, colour} = require('../config.json');
const picEmbed1 = new Discord.RichEmbed()
	.setColor(colour)
	.setTitle('Suggest an idea')
	.setURL('https://discord.gg/8agRm6c')
	.setDescription('**Page 1 of the arguments:** \nargument: a thing that isnt the prefix or command\nLonger definition:\nargument: a word, or usually a keyword, that specifies inputs for a command to activate')
	.addField('angrysub', '\`angrysub\`, \`angriestsub\`',true)
	.addField(`heroes ~~(add level in the command for the level image)\ne.g.\`\`${prefix}pic benjamin 20\`\`~~`, '\`benjamin\`,\`ocyn\`(ocean obyn),\`obyn\`,\`striker jones\`,\`biker bones\`,\`pat\`,\`dj ben\`,\`cyber quincy\`,\`quincy\`', true)
	.addField('caltrops','\`caltrops path\`,\`caltrops meme\`,\`caltrops meme 2\`')
	.addField('miscellanious','\`patch notes monkey\`,\`permacharge thanos\`')
  .addField('BloonFuzzli\'s Emojis **(use `emoji` in the argument)**','`think`,`ping`,`red`,`embarassed`,`laugh`,`supermonkey`,`rainbow`')
	.addField('fanart','use numbers \`1\`,\`2\`,\`3\`,\`...\`,\`10\`')
  .addField('wall of fire','`wof`,`wof2`')
  .setFooter('page 1 out of 3');
const picEmbed2 = new Discord.RichEmbed()
	.setColor('#23dbb6')
	.setTitle('Suggest an idea')
	.setURL('https://discord.gg/8agRm6c')
	.setDescription('**All the arguments: The fanart competition arguments**')
	.addField('competition (put \`comp\` in args', '\`2018\`, \`2019\` ;to use, type the year in th args, to show which year you are talking about',true)
	.addField('year 2018 fanart competition (put\`2018\`in the args', 'slideshow1st\` (shows 1st place),\`2nd\`,\`3rd\`,\`creative\`,\`intro\`,\`colourful\`,\`transform\`,\`real\`,\`slideshow\`', true)
	.addField('year 2019 fanart competition','\`winner\`,\`2,3,...,9\`,`GD`')
	.setFooter('page 2 out of 3');
const picEmbed3 = new Discord.RichEmbed()
	.setColor(colour)
	.setTitle('Suggest an idea')
	.setURL('https://discord.gg/8agRm6c')
	.setDescription('**More arguments**')
	.addField('towers **put "tower" in argument', '\`ultrajug\`, \`impale\`,`marine`',true)
  .setFooter('page 3 out of 3');
module.exports = {
	name: 'pic',
	description: 'send a picture',
	usage: '!pic <pic name>',
	cooldown: 5,
	execute(message, args, client) {
		
		var arg = message.content.slice(4).toLowerCase();
		if (arg.includes('ang')&&arg.includes('sub')&&!arg.includes('iest')){
			message.channel.send('angry sub, u/HelixSansTheSkeleton:',{files: ['./commands/images/angrysub.png']})
		}else if (arg.includes('ang')&&arg.includes('sub')&&arg.includes('est')){
			message.channel.send('angriest sub, by rohan:',{files:['./commands/images/angriestsub.png']})
		}else if (arg.includes('patch')&&arg.includes('note')&&arg.includes('monkey')){
			message.channel.send('patch notes monkey',{files: ['./commands/images/patchnotesmonkey.jpg']})
		}else if (arg.includes('cyber')&&arg.includes('quincy')){
			message.channel.send('cyber quincy',{files: ['./commands/images/cq.png']})
		}else if (arg.includes('cyber')===false&&arg.includes('quincy')){
			message.channel.send('quincy',{files: ['./commands/images/Quincy.png']})
		}else if (arg.includes('caltrops')){
			if (args.includes('path')){
				message.channel.send('https://www.reddit.com/r/btd6/comments/ctp6cw/caltrop_monkey/?utm_source=amp&utm_medium=&utm_content=post_vote')
			}else if(args.includes('meme')){
				if(args.includes('2')){
					message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/622449781561884694/1568473987063282479715781226784.jpg')
				}else{
					message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/622449341986111499/15684738829765082474052370842912.jpg')
				}
			}else{
				message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/622449506109358090/15684739217254070609815148999613.jpg')
			}
		}else if(arg.includes('quincy')&&arg.includes('trig')){
			message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/624160974156333057/triggered.jpg')
		}else if(arg.includes('permacharge')&&arg.includes('thanos')){
			message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/624170893333102617/pasted_image_0.png')
		}else if(arg.includes('obyn')){
			message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/624168395155177472/ObynGreenFoot.png')
		}else if(arg.includes('ocyn')){
			message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/624168955958788111/OceanObynPortraitsLvl20.png')
		}else if (arg.includes('striker')&&arg.includes('jones')){
			message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/624168367011397642/Striker_Jones.png')
		}else if(arg.includes('biker')&&arg.includes('bones')){
			message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/624168929954365461/okjjnwpkz5k21.png')
		}else if(arg.includes('pat')){
			message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/624168510515445780/PatFusty.png')
		}else if(arg.includes('ben')){
			if (arg.includes('dj')){
				if (arg.includes('20')){
					message.channel.send('https://cdn.discordapp.com/attachments/598768278550085633/624170428352561152/BenJamminPortraitLvl20.png')
				}else if(arg.includes('3')){
          message.channel.send('https://cdn.discordapp.com/attachments/594348433922457610/632870762851598336/183.png')
        }else if(arg.includes('7')){
          message.channel.send('https://cdn.discordapp.com/attachments/594348433922457610/632870900307591181/158.png')
        }else if(arg.includes('10')){
          message.channel.send('https://cdn.discordapp.com/attachments/594348433922457610/632871056570581049/185.png')
        }else {
					message.channel.send('https://cdn.discordapp.com/attachments/594348433922457610/632871150204223488/170.png')
				}
			}else{
				if (arg.includes('10')){
          message.channel.send('https://cdn.discordapp.com/attachments/594624229958352906/632569498276200468/BenjaminPortraitLvl10.png')
        }else if (arg.includes('20')){
          message.channel.send('https://cdn.discordapp.com/attachments/594348433922457610/632871529092218891/183.png')
        }
        else if(arg.includes('7')){
          message.channel.send('https://cdn.discordapp.com/attachments/594624229958352906/632569455142109245/BenjaminPortraitLvl7.png')
        }else if(arg.includes('3')){
          message.channel.send('https://cdn.discordapp.com/attachments/594348433922457610/632850605198671872/150.png')
        }else{
          message.channel.send('https://cdn.discordapp.com/attachments/594624229958352906/632568902437699584/Benjamin.png')
        }
			}
		}else if(arg.includes('emoji')){
			message.channel.send('credits to Bloonfuzzli');
			if (arg.includes('think')){
				message.channel.send('https://cdn.discordapp.com/attachments/408694070794256396/628413688646336513/monkey_thin.png')
			}else if (arg.includes('ping')){
				message.channel.send('https://cdn.discordapp.com/attachments/408694070794256396/628413669100748842/monkey_ping.png')
			}else if(arg.includes('embarassed')){
				message.channel.send('https://cdn.discordapp.com/attachments/408694070794256396/628413687023271946/icy_embarrased.png')
			}else if(arg.includes('supermonkey')){
				message.channel.send('https://cdn.discordapp.com/attachments/408694070794256396/628413686163308566/supermonkey.png')
			}else if (arg.includes('laugh')){
				message.channel.send('https://cdn.discordapp.com/attachments/408694070794256396/628413688079974410/monkey_laugh.png')
			}else if (arg.includes('red')){
				message.channel.send('https://cdn.discordapp.com/attachments/408694070794256396/628413671902543905/redbloon.png')
			}else if (arg.includes('rainbow')){
				message.channel.send('https://cdn.discordapp.com/attachments/408694070794256396/628413669461458946/drhelium.png')
			}
		}else if (arg.includes('fanart')){
			if (arg.includes('10')){
				message.channel.send('By Frostysss: https://www.reddit.com/r/btd6/comments/dfnwbm/witch_ezili_skin/')
			}else if (arg.includes('11')){
				message.channel.send('By Knightlyboi:https://www.reddit.com/r/btd6/comments/dluog5/ice_monkey_after_hours//')
			}else if (arg.includes('12')){
				message.channel.send('By Frostysss:https://www.reddit.com/r/btd6/comments/dpfop2/pirate_striker_jones_skin/')
			}else if (arg.includes('13')){
				message.channel.send('By Knightlyboi. https://www.reddit.com/r/btd6/comments/dluog5/ice_monkey_after_hours/')
			}else if (arg.includes('14')){
				message.channel.send('By MegaB0$$_||7#7015: https://cdn.discordapp.com/attachments/567692469332869120/642399009037877258/IMG_20191024_205310.jpg')
			}else if (arg.includes('15')){
				message.channel.send('by u/dogtop2450: https://www.reddit.com/r/btd6/comments/dst4r2/took_a_long_time/')
			}else if (arg.includes('15')){
				message.channel.send('by u/FrostBurnSpirit: https://www.reddit.com/r/btd6/comments/dslysh/i_made_a_glavie_lord_in_this_awesome_rplace_clone/')
			}else if (arg.includes('1')){
				message.channel.send('Made by Topaz: https://cdn.discordapp.com/attachments/425785341643980801/581930069984018465/ceramic_pixel_art.png')
			}else if (arg.includes('2')){
				message.channel.send('By Voeille: https://www.reddit.com/r/btd6/comments/btt9nm/different_perspective_maps_spring_spring_stylised/')
			}else if (arg.includes('3')){
				message.channel.send('By MaxStriker01: https://www.reddit.com/r/btd6/comments/c0efti/birthday_monkey_happy_anniversary/')
			}else if (arg.includes('4')){
				message.channel.send('By Mathnomancer_: https://www.reddit.com/r/btd6/comments/c4mrkx/i_finally_got_my_fan_art_piece_scanned_now_the/')
			}else if (arg.includes('5')){
				message.channel.send('5-5-5 Glue Gunner: The super bloon solver storm by literallyfabian: https://www.reddit.com/r/btd6/comments/cb384a/555_glue_gunner_the_super_bloon_solver_storm/')
			}else if (arg.includes('6')){
				message.channel.send('By chestnutskd:  https://www.reddit.com/r/btd6/comments/cmiw0o/i_like_how_master_bomber_looks_so_i_decided_to/')
			}else if (arg.includes('7')){
				message.channel.send('by GAME MOTION#1754: https://media.discordapp.net/attachments/609318883291168781/609318939650162698/btd_ninja.png')
			}else if (arg.includes('8')){
				message.channel.send('By LitLee-yo: https://www.reddit.com/r/btd6/comments/d81sex/get_them/')
			}else if (arg.includes('9')){
				message.channel.send('by MegaB0$$_||7#7015: https://cdn.discordapp.com/attachments/627722153474785328/627725950695768080/unknown.png')
			}/*else if (arg.includes('8')){
				message.channel.send('')
			}else if (arg.includes('8')){
				message.channel.send('')
			}*/
		}else if(arg.includes('comp')){
			if (arg.includes('2018')){
				if (arg.includes('1st')){
					message.channel.send('by **FreeFGP**: https://cdn.discordapp.com/attachments/567692469332869120/567812311771774978/1.png')
				}else if(arg.includes('2nd')){
					message.channel.send('by **Shadowgirl211**: https://cdn.discordapp.com/attachments/567692469332869120/567812336992256000/2.png')
				}else if (arg.includes('3rd')){
					message.channel.send('by **iriplard**: https://cdn.discordapp.com/attachments/567692469332869120/567812368889806849/3.png')
				}else if (arg.includes('intro')){
					message.channel.send('Best introduction (SpaceMonkey\'s pick!) by CalmCollectedOmega: https://bit.ly/2M1zXVi')
				}else if (arg.includes('creative')){
					message.channel.send('Most creative by DespacitoMage: https://bit.ly/2MQWB89')
				}else if (arg.includes('colourful')){
					message.channel.send('Most colorful by DespacitoMage\'s little brother! https://bit.ly/2CoK9HF')
				}else if (arg.includes('transform')){
					message.channel.send('Most transformative by ILikeOrangeOwl: https://bit.ly/2MT1s8D')
				}else if (arg.includes('real')){
					message.channel.send('Most realistic by DrPaperDude: https://bit.ly/2PLf82L')
				}else if (arg.includes('slideshow')){
					message.channel.send('You can see all of the submissions in a slideshow made by SpaceMonkey:http://bit.ly/thisisntaswear')
				}
				else{message.channel.send('https://www.reddit.com/r/btd6/comments/9ddsfb/fan_art_competition_winners/')}
			}else if (arg.includes('2019')){
				if (arg.includes('win')){
					message.channel.send('u/FreeFGP with their Grandmaster ninja submission: https://www.reddit.com/r/btd6/comments/bunb7r/grandmaster_ninja_for_the_fanart_contest/\ntiny confession: the dev has this as his wallpaper')
				}else if (arg.includes('2')){
					message.channel.send('u/Thundergawker with their Monkey Engineer Workshop!: https://i.redd.it/zyibj8fmau231.png')
				}else if(arg.includes('3')){
					message.channel.send('u/dreptile with their Icicle impale Pixel Art: https://www.reddit.com/r/PixelArt/comments/brbvei/btd6_icicle_impale_animated_stream/')
				}else if(arg.includes('4')){
					message.channel.send('u/Xx_GenericName69_xX with their Dart Monkey: https://www.reddit.com/r/btd6/comments/brtouf/heres_a_dart_monkey_i_drew_for_fun/')
				}else if (arg.includes('5')){
					message.channel.send('u/HikingPotato with their Lego Apache Prime: https://www.reddit.com/r/btd6/comments/btota1/lego_apache_prime/')
				}else if (arg.includes('6')){
					messags.channel.send('u/Icheft534 with "I\'ve got a B.A.D. feeling about this: https://www.reddit.com/r/btd6/comments/bsh2s3/ive_got_a_bad_feeling_about_this/')
				}else if (arg.includes('7')){
					messags.channel.send('u/JackSavage18 with the blueprints for the M.A.D. (Menacing Air Destroyer): https://www.reddit.com/r/btd6/comments/bqyad6/the_blue_prints_for_a_project_that_puts_the_bad/')
				}else if(arg.includes('8')){
					message.channel.send('u/NetNormie with their Music is the best form of Fan Art rap. https://www.reddit.com/r/btd6/comments/bqcqji/music_is_the_best_form_of_fan_art/')
				}else if(arg.includes('9')){
					message.channel.send('u/DaRealPhoneix with their memes AND art submission: https://www.reddit.com/r/btd6/comments/bu006t/me_explaining_to_random_redditors_why_make_bloons/ep53lvm/?context=3\nhttps://www.reddit.com/r/btd6/comments/bsscrr/me_making_more_bloons_meme_templates/\nhttps://www.reddit.com/r/btd6/comments/bs1myx/it_do_be_like_that/\nhnngggrrrr was responsible for the existence of this fan art: https://www.reddit.com/r/btd6/comments/bt5hlp/me_likes_making_memes_and_art_community_make_some/')
				}else if(arg.includes('GD')){
					message.channel.send('u/Pugmaster706 with their Bloons TD 6 styled Geometry Dash level:https://www.youtube.com/watch?v=Y12mahjLwnc')
				}
			}
		}else if (arg.includes('wof')){
      if(arg.includes('2')){
        message.channel.send('T posing wall of fire: https://cdn.discordapp.com/emojis/638082054168379418.png?v=1')
      }else{
        message.channel.send('https://cdn.discordapp.com/emojis/638082061881704465.png?v=1')
      }
    }else if (arg.includes('tower')){
      if (arg.includes('ultrajug')){
        message.channel.send('https://cdn.discordapp.com/emojis/638082057804709928.png?v=1')
      }else if (arg.includes('poper')||arg.includes('marine')){
        message.channel.send('https://cdn.discordapp.com/emojis/638082060103188520.png?v=1')
      }else if (arg.includes('impale')){
        message.channel.send('https://cdn.discordapp.com/emojis/638082059197218817.png?v=1')
      }
    }
		else if(arg.includes('help')){
			if (arg.includes('2')){
        message.channel.send(picEmbed2)
      }else if (arg.includes('3')){
        message.channel.send(picEmbed3)
      }else{
      	message.channel.send(picEmbed1)
    	}	
		}
		else{
			message.channel.send('use \`!pic help\` for help')
		}
	},
};