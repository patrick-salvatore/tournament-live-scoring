import type { Player } from "~/lib/player";
import type { Team } from "~/lib/team";

import client, { rawClient } from "./client";
import type { Jwt } from "~/lib/auth";
import type { ScoreCard } from "~/lib/score-card";

export async function getTeamById(teamId: string) {
  return client.get<Team>(`/v1/team/${teamId}`).then((res) => res.data);
}

export async function assignTeam(teamId: string) {
  return rawClient.post<Jwt>(`/v1/team/_assign`, { teamId }).then((res) => {
    return res.data.token;
  });
}
