import type { Session } from "~/lib/auth";
import client from "./client";
import type { Tournament } from "~/lib/tournaments";

export async function getTournamentById(id: string) {
  return client.get<Tournament>(`/v1/tournament/${id}`).then((res) => res.data);
}

export async function startTournament({
  teamId,
  tournamentId: tournamentId,
}: Session) {
  return client.post<void>(
    `/v1/tournament/${tournamentId}/team/${teamId}/start`
  );
}
