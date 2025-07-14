/* @refresh reload */
import "./index.css";

import { render } from "solid-js/web";
import { ErrorBoundary, onMount, Suspense } from "solid-js";

import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { createAsync, Route, Router, useNavigate } from "@solidjs/router";

import { authCheck } from "~/lib/auth";

import AppStoreSetter from "~/state";

import AppShell from "~/components/shell";

import TeamIdentity from "./pages";
import StartRoute from "./pages/start_tournament";
import LeaderboardRoute from "./pages/leaderboard";
import ScoreCardRoute from "./pages/scorecard";
import WagersRoute from "./pages/wagers";
import AdminRoute from "./pages/admin";
import ReadOnlyRoute from "./pages/read_only";

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
      <ErrorBoundary
        fallback={(error, reset) => {
          console.error(error);
          return (
            <div>
              <p>Something went wrong: {error.message}</p>
              <button onClick={reset}>Try Again</button>
            </div>
          );
        }}
      >
        <Suspense>
          <Router root={AppShell}>
            <Route
              path="/tournament"
              preload={() => createAsync(async () => authCheck())}
              component={AppStoreSetter}
            >
              <StartRoute />
              <ScoreCardRoute />
              <LeaderboardRoute />
              <WagersRoute />
              <Route path="*" component={TeamIdentity} />
            </Route>
            <AdminRoute />
            <ReadOnlyRoute />
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
      </ErrorBoundary>
    </QueryClientProvider>
  ),
  root!
);
