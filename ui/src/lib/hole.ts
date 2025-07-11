export type Score = string;

export type Hole = {
  strokeHole: number;
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
  playerHandicap: string;
  awardedTournamentHandicap: number;
};

export type UpdateHolePayload = Partial<Hole>;
