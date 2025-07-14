import type { Leaderboard } from "~/lib/leaderboard";
import client from "./client";
import type { Hole } from "~/lib/hole";

export async function getLeaderboard(
  tournamentId: string,
  individuals = false
) {
  return client
    .get<Leaderboard>(
      `/v1/tournament/${tournamentId}/leaderboard?individuals=${individuals}`
    )
    .then((res) => res.data);
}

export async function getHolesForLeaderboard(tournamentId: string) {
  return client
    .get<Hole[]>(`/v1/tournament/${tournamentId}/holes`)
    .then((res) => res.data);
}
