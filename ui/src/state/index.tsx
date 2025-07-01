import { batch, createRenderEffect, type ParentComponent } from "solid-js";
import { useCurrentMatches, useLocation, useNavigate } from "@solidjs/router";

import { getPlayersByTeamId } from "~/api/players";
import { getAllTeams, getTeamById } from "~/api/teams";
import { getTournamentById } from "~/api/tournaments";
import { getScoreCardsForTeamByTournament } from "~/api/scorecards";
import { getCourseDataByTournamentId } from "~/api/course";

import type { ScoreCardWithHoles } from "~/lib/score-card";

import { useTournamentStore } from "~/state/tournament";
import { useTeamStore } from "~/state/team";
import { usePlayerStore } from "~/state/player";

import { useSessionStore } from "./session";
import { useScoreCardStore } from "./score-card";
import { useCourseStore } from "./course";
import { identity } from "./helpers";
import { boolean } from "zod/v4";

const AppStoreSetter: ParentComponent = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getSession = useSessionStore(identity);
  const { init: setTeamStore } = useTeamStore();
  const { init: setPlayerStore } = usePlayerStore();
  const { init: setCourseStore } = useCourseStore();
  const { init: setTournamentStore } = useTournamentStore();
  const { init: scoreCardStore } = useScoreCardStore();

  createRenderEffect(() => {
    const session = getSession();
    (async function _() {
      if (!session?.teamId || !session?.tourneyId) {
        return;
      }

      const [tournament, teams, players, course] = await Promise.all([
        getTournamentById(session.tourneyId),
        getAllTeams(session.tourneyId),
        getPlayersByTeamId(session.teamId),
        getCourseDataByTournamentId(session.tourneyId),
      ]);

      let scoreCards: ScoreCardWithHoles[] = [];
      try {
        scoreCards = await getScoreCardsForTeamByTournament({
          teamId: session.teamId,
          tournamentId: session.tourneyId,
        });
      } catch {
        navigate(`/tournament/${tournament.uuid}`, { replace: true });
      }

      batch(() => {
        setTournamentStore(tournament);
        setTeamStore(teams);
        setPlayerStore(players);
        scoreCardStore(scoreCards);
        setCourseStore(course);
      });

      const locationParts = location.pathname.split("/").filter(Boolean);
      if (
        locationParts.length == 1 &&
        locationParts.find((key) => key == "tournament")
      ) {
        navigate(`/tournament/${tournament.uuid}`, { replace: true });
      }
    })();
  });

  return props.children;
};

export default AppStoreSetter;
