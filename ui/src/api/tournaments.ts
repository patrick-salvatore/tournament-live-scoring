import client from "./client";
import type { Tournament } from "~/lib/tournaments";

export async function getTournamentById(id: string) {
  return client.get<Tournament>(`/v1/tournament/${id}`).then((res) => res.data);
}
