import type { Hole, UpdateHolePayload } from "~/lib/hole";

import client from "./client";

export async function updateHoleScores(payload: UpdateHolePayload[]) {
  return client.put<UpdateHolePayload[]>(`/v1/holes`, payload);
}

export async function getAllTournamentHolesForTeam({
  teamId,
  tournamentId,
}: {
  teamId: string;
  tournamentId: string;
}) {
  return client
    .get<Hole[]>(`/v1/holes/${teamId}/${tournamentId}`)
    .then((res) => res.data);
}
