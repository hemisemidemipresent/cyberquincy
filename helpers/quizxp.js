// im limited by my intelligence of  my time. If you can find a way to make the number of quiz questions answered correct stat. please make this work. its 33 degrees celcius outside and I can't think.
module.exports = {
    async addQuizXp(message) {
        user = message.author;

        let tag = await Tags.findOne({
            where: {
                name: user.id,
            },
        });

        // Create db user if it doesn't already exist
        if (!tag) {
            tag = await Tags.create({
                name: user.id,
                xp: 0,
                showAds: true,
                showLevelUpMsg: true,
                quiz: 0,
            });
        }
        // if quiz is undefined, make it 1
        if (tag.quiz === undefined) {
            Tags.update({ quiz: 1 }, { where: { name: user.id } });
        } else {
            Tags.update({ quiz: tag.quiz + 1 }, { where: { name: user.id } });
        }
    },
    async getQuizXp(message) {
        user = message.author;
        let tag = await Tags.findOne({
            where: {
                name: user.id,
            },
        });
        if (!tag) {
            tag = await Tags.create({
                name: user.id,
                xp: 0,
                showAds: true,
                showLevelUpMsg: true,
                quiz: 0,
            });
        }
        if (tag.quiz === undefined) {
            return message.channel.send(
                "You haven't gotten any quizzes correct yet!"
            );
        } else {
            return message.channel.send(
                `You have gotten ${tag.quiz} quizzes correct`
            );
        }
    },
};
