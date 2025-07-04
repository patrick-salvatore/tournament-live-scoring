import {
  batch,
  createEffect,
  createRenderEffect,
  Show,
  type ParentComponent,
} from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";

import { getTeamById, getTeamPlayersById } from "~/api/teams";
import { getTournamentById } from "~/api/tournaments";
import { getCourseDataByTournamentId } from "~/api/course";

import { useTournamentStore } from "~/state/tournament";
import { useTeamStore } from "~/state/team";

import { useSessionStore } from "./session";
import { useCourseStore } from "./course";
import { identity } from "./helpers";

const ROUTES = ["start", "leaderboard", "scorecard"];

const AppStoreSetter: ParentComponent = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  const session = useSessionStore(identity);
  const { init: setTeamStore } = useTeamStore();
  const { init: setCourseStore } = useCourseStore();
  const { init: setTournamentStore } = useTournamentStore();

  createEffect(() => {
    (async function _() {
      try {
        if (!session()?.teamId || !session()?.tournamentId) {
          return;
        }

        const [tournament, team, teamPlayers, course] = await Promise.all([
          getTournamentById(session()!.tournamentId),
          getTeamById(session()!.teamId),
          getTeamPlayersById(session()!.teamId),
          getCourseDataByTournamentId(session()!.tournamentId),
        ]);
        
        batch(() => {
          setTournamentStore(tournament);
          setTeamStore(team, teamPlayers);
          setCourseStore(course);
        });

        const [, page] = location.pathname.split("/").filter(Boolean);
        if (!ROUTES.find((r) => r === page)) {
          navigate(`/tournament/scorecard`);
        } else if (team.started) {
          navigate(`/tournament/${page}`);
        } else {
          navigate(`/tournament/start`);
        }
      } catch {
        navigate(`/tournament/assign`);
      }
    })();
  });

  return props.children;
};

export default AppStoreSetter;
