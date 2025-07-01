/* @refresh reload */
import "./index.css";

import { render } from "solid-js/web";
import { Suspense } from "solid-js";

import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { createAsync, Route, Router, useNavigate } from "@solidjs/router";

import { authCheck } from "~/lib/auth";

import AppStoreSetter from "~/state";

import AppShell from "~/components/shell";
import TournamentView from "~/components/tournament-view";
import { Toaster, TOAST_POSITION } from "~/components/toast";

import Home from "./pages/home";
import Tournament from "./pages/tournament";
import ScoreCard from "./pages/score-card";
import LeaderBoard from "./pages/leader-board";

const root = document.getElementById("root");

// @ts-ignore
if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

const queryClient = new QueryClient();

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <Suspense>
        <Router root={AppShell}>
          <Route
            path="/tournament"
            preload={() => createAsync(async () => authCheck())}
            component={AppStoreSetter}
          >
            <Route path="/:uuid" component={Tournament} />
            <Route component={TournamentView}>
              <Route path="/:teamId/scoreCard" component={ScoreCard} />
              <Route path="/:leaderBoard" component={LeaderBoard} />
            </Route>
            <Route path="/" component={Home} />
          </Route>
          <Route
            path="*"
            component={() => {
              const navigate = useNavigate();
              navigate("/tournament", { replace: true });

              return <></>;
            }}
          />
        </Router>
        <Toaster position={TOAST_POSITION.BOTTOM_LEFT} />
      </Suspense>
    </QueryClientProvider>
  ),
  root!
);
