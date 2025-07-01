import type { Course } from "~/lib/course";
import client from "./client";

export async function getCourseDataByTournamentId(tournamentId: string) {
  return client
    .get<Course>(`/v1/course/${tournamentId}`)
    .then((res) => res.data);
}
