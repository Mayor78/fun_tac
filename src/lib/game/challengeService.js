import { ref, get, update, db } from '../firebase';
import { getPlayerId } from '../../utils/gameLogic';

const CHALLENGES = [
  { id: 'win_3x3', title: 'Classic Victor', desc: 'Win a 3x3 game', goal: 1, type: 'win', size: 3, reward: 50 },
  { id: 'win_4x4', title: 'Grid Master', desc: 'Win a 4x4 game', goal: 1, type: 'win', size: 4, reward: 100 },
  { id: 'win_sudden', title: 'Survivor', desc: 'Win a Sudden Death game', goal: 1, type: 'mode', mode: 'sudden_death', reward: 80 },
  { id: 'play_3', title: 'Frequent Player', desc: 'Play 3 games of any kind', goal: 3, type: 'play', reward: 60 },
];

export async function getDailyChallenges() {
  const playerId = getPlayerId();
  const challengeRef = ref(db, `leaderboard/${playerId}/dailyChallenges`);
  const snapshot = await get(challengeRef);
  let data = snapshot.val();

  // If no challenges today, or expired, reset
  const today = new Date().toDateString();
  if (!data || data.date !== today) {
    data = {
      date: today,
      challenges: CHALLENGES.map(c => ({ ...c, progress: 0, completed: false }))
    };
    await update(ref(db, `leaderboard/${playerId}/dailyChallenges`), data);
  }
  return data.challenges;
}

export async function updateChallengeProgress(type, metadata = {}) {
  const playerId = getPlayerId();
  const challengeRef = ref(db, `leaderboard/${playerId}/dailyChallenges`);
  const snapshot = await get(challengeRef);
  const data = snapshot.val();

  if (!data || data.date !== new Date().toDateString()) return;

  const updatedChallenges = data.challenges.map(c => {
    if (c.completed) return c;

    let progress = c.progress;
    if (c.type === type) {
      if (type === 'win' && metadata.size === c.size) progress++;
      else if (type === 'mode' && metadata.mode === c.mode) progress++;
      else if (type === 'play') progress++;
    }

    const completed = progress >= c.goal;
    return { ...c, progress, completed };
  });

  await update(ref(db, `leaderboard/${playerId}/dailyChallenges`), { challenges: updatedChallenges });
  
  // Reward for completed challenges
  const newlyCompleted = updatedChallenges.filter((c, i) => c.completed && !data.challenges[i].completed);
  if (newlyCompleted.length > 0) {
    const totalReward = newlyCompleted.reduce((sum, c) => sum + c.reward, 0);
    const playerRef = ref(db, `leaderboard/${playerId}`);
    const playerSnap = await get(playerRef);
    const playerStats = playerSnap.val();
    if (playerStats) {
      await update(playerRef, { coins: (playerStats.coins || 0) + totalReward });
    }
  }
}
