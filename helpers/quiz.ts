import { Collection } from 'discord.js';

/** {user ID: number of quiz questions answered correctly in a row}; resets when the bot restarts */
const streaks = new Collection<string, number>();

function answerCorrect(userID: string): void {
    streaks.set(userID, (streaks.get(userID) ?? 0) + 1);
}

function answerWrong(userID: string): void {
    streaks.delete(userID);
}

function getStreak(userID: string): string {
    return streaks.has(userID) ? `Streak: ${streaks.get(userID)}` : 'No Streak Currently';
}

export { answerCorrect, answerWrong, getStreak };
