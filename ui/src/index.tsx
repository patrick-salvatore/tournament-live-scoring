/* @refresh reload */
import "./index.css";

import { render } from "solid-js/web";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Route, Router } from "@solidjs/router";

import Home from "./pages/home";
import Tournament from "./pages/tournament";

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
      <Router>
        <Route path="/:uuid" component={Tournament} />
        <Route path="/" component={Home} />
      </Router>
    </QueryClientProvider>
  ),
  root!
);
