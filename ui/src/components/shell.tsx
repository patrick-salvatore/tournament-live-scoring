import type { ParentComponent } from "solid-js";
import { identity } from "~/state/helpers";
import { useTournamentStore } from "~/state/tournament";

const AppShell: ParentComponent = (props) => {
  const teamName = useTournamentStore(identity);

  return (
    <div class="flex min-h-screen flex-col bg-gray-100 text-gray-900">
      <header class="bg-white shadow">
        <div class="container mx-auto px-4 py-4">
          <h1 class="text-xl font-semibold capitalize">{teamName.name}</h1>
        </div>
      </header>
      <main class="flex-1 container mx-auto px-4 py-8">{props.children}</main>
      <footer class="flex items-center justify-center flex-col gap-4 px-4 pb-4">
        <p class="text-neutral-800 text-sm">
          &copy;2025 Tournament Live Scoring, Inc.
        </p>
      </footer>
    </div>
  );
};

export default AppShell;
