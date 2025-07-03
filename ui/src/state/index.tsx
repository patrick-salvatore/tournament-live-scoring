import {
  batch,
  createEffect,
  createRenderEffect,
  type ParentComponent,
} from "solid-js";
import { useCurrentMatches, useLocation, useNavigate } from "@solidjs/router";

import { getTeamById } from "~/api/teams";
import { getTournamentById } from "~/api/tournaments";
import { getCourseDataByTournamentId } from "~/api/course";

import { useTournamentStore } from "~/state/tournament";
import { useTeamStore } from "~/state/team";

import { useSessionStore } from "./session";
import { useCourseStore } from "./course";
import { identity } from "./helpers";

export const SessionCheck: ParentComponent = (props) => {
  const navigate = useNavigate();
  const team = useTeamStore(identity);
  const session = useSessionStore(identity);
  const tournament = useTournamentStore(identity);

  createEffect(() => {
    try {
      console.log(session(), team(), tournament());
    } catch {}
  });
  return props.children;
};

const AppStoreSetter: ParentComponent = (props) => {
  const getSession = useSessionStore(identity);
  const { store: team, init: setTeamStore } = useTeamStore();
  const { init: setCourseStore } = useCourseStore();
  const { init: setTournamentStore } = useTournamentStore();

  createRenderEffect(() => {
    const session = getSession();
    (async function _() {
      if (!session?.teamId || !session?.tournamentId) {
        return;
      }

      const [tournament, team, course] = await Promise.all([
        getTournamentById(session.tournamentId),
        getTeamById(session.teamId),
        getCourseDataByTournamentId(session.tournamentId),
      ]);

      batch(() => {
        setTournamentStore(tournament);
        setTeamStore(team);
        setCourseStore(course);
      });
    })();
  });

  return props.children;
};

export default AppStoreSetter;
