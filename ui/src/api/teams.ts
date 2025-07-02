import type { Team, Teams, UpdateTeamPayload } from "~/lib/team";

import client, { rawClient } from "./client";
import type { Jwt } from "~/lib/auth";
import type { Hole } from "~/lib/hole";

export async function getTeamById(teamId: string) {
  return client.get<Team>(`/v1/team/${teamId}`).then((res) => res.data);
}

export async function updateTeam(teamId: string, data: UpdateTeamPayload) {
  return client.patch<Team>(`/v1/team/${teamId}`, data).then((res) => res.data);
}

export async function getAllTeams(tournamentId: string) {
  return client
    .get<Teams>(`/v1/tournament/${tournamentId}/teams`)
    .then((res) => res.data);
}

export async function assignTeam(teamId: string) {
  return rawClient.post<Jwt>(`/v1/team/${teamId}/assign`).then((res) => {
    return res.data.token;
  });
}

export async function getTeamHoles(teamId: string) {
  return client.get<Hole[]>(`/v1/team/${teamId}/holes`).then((res) => res.data);
}
