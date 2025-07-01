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
};

export type UpdateHolePayload = Partial<Hole>;
