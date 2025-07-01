import type { Player } from "~/lib/player";
import client from "./client";

export async function getPlayersByTeamId(teamId: string) {
  return client
    .get<Player[]>(`/v1/team/${teamId}/players`)
    .then((res) => res.data);
}
