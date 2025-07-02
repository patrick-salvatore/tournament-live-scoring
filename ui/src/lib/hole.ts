export type Score = string;
export type Hole = {
  strokeHole: boolean;
  id: string;
  playerId: string;
  tournamentId: string;
  par: number;
  handicap: number;
  number: number;
  score: string;
  teamId?: string;
};

export type HoleWithMetadata = {
  id: string;
  score: string;
  par: number;
  handicap: number;
  number: number;
  playerId: string;
  teamId: string;
  playerHandicap: number;
  awardedTournamentHandicap: number;
};

export type UpdateHolePayload = Partial<Hole>;
