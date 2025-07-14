import { Match, Show, Suspense, Switch } from "solid-js";
import { Route } from "@solidjs/router";

import { identity } from "~/state/helpers";
import { useTournamentStore } from "~/state/tournament";

import TournamentView from "~/components/tournament_view";
import MatchPlayLeaderboard from "~/components/leaderboard/match_play_leaderboard";
import StrokePlayLeaderboard from "~/components/leaderboard/stroke_play_leaderboard";


export default () => {
  const tournament = useTournamentStore(identity);

  return (
    <Route
      path="leaderboard"
      component={() => (
        <Show when={tournament().id}>
          <TournamentView>
            <Suspense>
              <Switch>
                <Match when={tournament().isMatchPlay}>
                  <MatchPlayLeaderboard />
                </Match>
                <Match when={true}>
                  <StrokePlayLeaderboard />
                </Match>
              </Switch>
            </Suspense>
          </TournamentView>
        </Show>
      )}
    />
  );
};
