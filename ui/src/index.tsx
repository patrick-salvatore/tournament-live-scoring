/* @refresh reload */
import "./index.css";

import { render } from "solid-js/web";
import { onMount, Suspense } from "solid-js";

import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { createAsync, Route, Router, useNavigate } from "@solidjs/router";

import { authCheck } from "~/lib/auth";

import AppStoreSetter from "~/state";

import AppShell from "~/components/shell";

import TeamIdentity from "./pages";
import AssignRoute from "./pages/assign";
import LeaderBoard from "./pages/leaderboard";
import ScoreCardRoute from "./pages/scorecard";

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
            <ScoreCardRoute />
            <AssignRoute />
            <LeaderBoard />

            <Route path="*" component={TeamIdentity} />
          </Route>
          <Route
            path="*"
            component={() => {
              const navigate = useNavigate();
              onMount(() => {
                navigate("/tournament", { replace: true });
              });
              return <></>;
            }}
          />
        </Router>
      </Suspense>
    </QueryClientProvider>
  ),
  root!
);
