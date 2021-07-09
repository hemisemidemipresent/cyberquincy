const { discord } = require('../aliases/misc.json');

module.exports = {
    name: 'hentai',
    aliases: ['nsfw'],
    execute(message, args) {
        channel = message.channel;
        if (!channel.nsfw) {
            return;
        } else {
            let links = [
                'https://www.youtube.com/watch?v=7wEHo_uUgZ0 the time signature of this one trips me up every time and never gets old',
                'https://www.youtube.com/watch?v=OOefbCXJ0Sc',
                'https://cdn.discordapp.com/attachments/699781597515481159/858000583670890496/Screenshot_310.png',
                'you sit there, behind the piano, it has been 5 hours and you haven´t even reached the fastest parts. sweat runs down your face as another misstep fills your brain with stress. your fingers, red from tip to base from your stress/rage piano hitting, are cramped and tired. then it happened, you did everything alright. you reach the fastest parts realizing you cant keep up. you feel a pain in your fingers different than your current and eternal pain. you realize, your fingers caught fire. your fingers are faster than ever while the fire reaches your hands. your fingers practically race over the keys while the fire took your entire arm. extreme joy and pain reach you when you are almost done. you now play with your fingerbones while the remaining flesh is being burnt. you hit the final note, you are free now. you quickly douse the fires consuming the remaining flesh around your arm. when your done you can feel something happening, a holy feeling. god saw his skill, he wanted someone with that skill. as you slowly levitate from your chair you feel enlightening. you made it. you ascended.',
                'übernut',
                'https://www.youtube.com/watch?v=ygy6O9kVt7U',
                'https://www.youtube.com/watch?v=7KSzIGREAWE **1:31**',
                'https://www.youtube.com/watch?v=3oDWlQbqCBc gives me PTSD but nice',
                'https://www.youtube.com/watch?v=Q16KpquGsIc',
                'https://www.youtube.com/watch?v=jv1yYDzvFtQ',
                'https://www.youtube.com/watch?v=hYcb854qGx0',
                'https://www.youtube.com/watch?v=8dHMVmhBogk',
                'https://www.youtube.com/watch?v=twaJeiD-hnw',
                'https://www.youtube.com/watch?v=GPxTX2kVzYE',
                'https://www.youtube.com/watch?v=tO1dVPu7860',
                'https://www.youtube.com/watch?v=ioQLlX2ELbg',
                'https://www.youtube.com/watch?v=0smPNpVHOH8',
                'https://www.youtube.com/watch?v=5ICZ0AAgDuA',
                'https://www.youtube.com/watch?v=iIY4L2CVRoE',
                'https://www.youtube.com/watch?v=XUed7HZtTNA',
                'https://www.youtube.com/watch?v=_5FFYMe-MGE',
                'https://www.youtube.com/watch?v=tAF4JvR7x2o',
                'https://www.youtube.com/watch?v=7RBJ4NMOBV0',
                'https://www.youtube.com/playlist?list=PLMnOReS0HOrTrk125k809vjNuRzQCZ0Sz - gives me PTSD but still',
            ];
            int = Math.floor(Math.random() * links.length);

            return message.channel.send(links[int]);
        }
    },
};
