export type Team = {
  id: string;
  name: string;
  displayName: string;
  tournamentId: string;
  started: boolean;
  finished: boolean;
};
export type Teams = Team[];

export type UpdateTeamPayload = Partial<Team>;
