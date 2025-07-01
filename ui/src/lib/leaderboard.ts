export type LeaderboardRow = {
  teamId: string;
  teamName: string;
  grossScore: number;
  netScore: number;
  thru: number;
};

export type Leaderboard = LeaderboardRow[];
