import type { Leaderboard } from "~/lib/leaderboard";
import client from "./client";

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
