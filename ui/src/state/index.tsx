import { batch, createRenderEffect, type ParentComponent } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";

import { getPlayersByTeamId } from "~/api/players";
import { getTeamById } from "~/api/teams";
import { getTournamentById } from "~/api/tournaments";
import { getScoreCardsForTeamByTournament } from "~/api/score-cards";
import { getCourseDataByTournamentId } from "~/api/course";

import type { ScoreCardWithHoles } from "~/lib/score-card";

import { useTournamentStore } from "~/state/tournament";
import { useTeamStore } from "~/state/team";
import { usePlayerStore } from "~/state/player";

import { useSessionStore } from "./session";
import { useScoreCardStore } from "./score-card";
import { useCourseStore } from "./course";

const AppStoreSetter: ParentComponent = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  const sessionStore = useSessionStore();
  const { init: setTeamStore } = useTeamStore();
  const { init: setPlayerStore } = usePlayerStore();
  const { init: setCourseStore } = useCourseStore();
  const { init: setTournamentStore } = useTournamentStore();
  const { init: scoreCardStore } = useScoreCardStore();

  createRenderEffect(() => {
    const session = sessionStore.session();
    (async function _() {
      if (!session.teamId || !session.tourneyId) {
        return;
      }

      const [tournament, team, players, course] = await Promise.all([
        getTournamentById(session.tourneyId),
        getTeamById(session.teamId),
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
        setTeamStore(team);
        setPlayerStore(players);
        scoreCardStore(scoreCards);
        setCourseStore(course);
      });

      if (location.pathname == "/tournament") {
        navigate(`/tournament/${tournament.uuid}`, { replace: true });
      }
    })();
  });

  return props.children;
};

export default AppStoreSetter;
