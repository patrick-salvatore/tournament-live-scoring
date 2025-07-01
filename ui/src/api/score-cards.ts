import type { ScoreCardWithHoles } from "~/lib/score-card";
import client from "./client";

export async function getScoreCardsForTeamByTournament({
  teamId,
  tournamentId,
}: {
  teamId: string;
  tournamentId: string;
}) {
  return client
    .get<ScoreCardWithHoles[]>(`/v1/score_cards/${tournamentId}/${teamId}`)
    .then((res) => res.data);
}

export async function createScoreCardsForTeam({
  teamId,
  tournamentId,
}: {
  teamId: string;
  tournamentId: string;
}) {
  return client
    .post<ScoreCardWithHoles[]>(`/v1/score_cards`, { teamId, tournamentId })
    .then((res) => res.data);
}
