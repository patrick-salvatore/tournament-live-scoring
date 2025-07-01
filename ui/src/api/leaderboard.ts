import type { Leaderboard } from "~/lib/leaderboard";
import client from "./client";

export async function getLeaderboard(tournamentId: string) {
  return client
    .get<Leaderboard>(`/v1/tournament/${tournamentId}/leaderboard`)
    .then((res) => res.data);
}
