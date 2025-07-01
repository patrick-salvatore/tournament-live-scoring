import client from "./client";
import type { HoleWithMetadata } from "~/lib/hole";

export async function getLeaderboard(tournamentId: string) {
  return client
    .get<HoleWithMetadata[]>(`/v1/tournament/${tournamentId}/leaderboard`)
    .then((res) => res.data);
}
