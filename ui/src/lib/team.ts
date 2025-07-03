export type PlayerId = string;

export type Player = {
  id: PlayerId;
  name: string;
  handicap: number;
  teamId: string;
};

export type Team = {
  id: string;
  name: string;
  displayName: string;
  tournamentId: string;
  started: boolean;
  finished: boolean;
  players: Player[];
};

export type Teams = Team[];

export type UpdateTeamPayload = Partial<Team>;
