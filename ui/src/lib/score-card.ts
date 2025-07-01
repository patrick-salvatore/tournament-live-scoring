import type { Hole } from "./hole";

export type ScoreCard = {
  id: string;
  playerId: string;
  tournamentId: string;
  created: string;
  updated: string;
  finished: boolean;
  grossScore: number;
  netScore: number;
};

export type ScoreCardWithHoles = ScoreCard & {
  holes: Hole[];
};

// Working with holes
export function calculateTotalPar(scoreCard: ScoreCardWithHoles): number {
  return scoreCard.holes.reduce((total, hole) => total + hole.par, 0);
}

// Type guards
export function isFinished(scoreCard: ScoreCardWithHoles): boolean {
  return scoreCard.finished && scoreCard.grossScore > 0;
}
