import type { ParentComponent } from "solid-js";
import { identity } from "~/state/helpers";
import { useTournamentStore } from "~/state/tournament";

const AppShell: ParentComponent = (props) => {
  const tournamentName = useTournamentStore(identity);

  return (
    <div class="flex min-h-screen flex-col bg-gray-100 text-gray-900">
      <header class="bg-white shadow">
        <div class="container mx-auto px-4 py-4">
          <h1 class="text-xl font-semibold capitalize">
            {tournamentName().name}
          </h1>
        </div>
      </header>
      <main class="flex-1 container mx-auto p-4">{props.children}</main>
      <footer class="flex items-center justify-center flex-col gap-4 px-4 pb-4"></footer>
    </div>
  );
};

export default AppShell;
