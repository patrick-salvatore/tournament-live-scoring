import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { createMemo, For, Show, Suspense } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import type { Leaderboard } from "~/lib/leaderboard";
import { getLeaderboard } from "~/api/leaderboard";
import { useSessionStore } from "~/state/session";
import { identity } from "~/state/helpers";
import { groupByIdMap } from "~/lib/utils";
import TournamentView from "~/components/tournament_view";
import { Route } from "@solidjs/router";
import { useTournamentStore } from "~/state/tournament";

const Leaderboard = () => {
  const session = useSessionStore(identity);

  const holesQuery = useQuery(() => ({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(session()?.tournamentId!),
    initialData: [],
  }));

  const leaderBoard = createMemo(() => {
    const groupByScore = groupByIdMap(holesQuery.data, "netScore");

    return Object.entries(groupByScore).sort((a, b) => {
      return +a[0] > +b[0] ? 1 : -1;
    });
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pos.</TableHead>
          <TableHead>Team</TableHead>
          <TableHead class="text-right">Net</TableHead>
          <TableHead class="text-center">Thru</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={leaderBoard()}>
          {([, teams], position) => (
            <For each={teams}>
              {(row) => {
                const isTied = teams.length > 1;
                const pos = position() + 1;
                const netScore = row.netScore;

                return (
                  <TableRow>
                    <TableCell class="font-medium">
                      {isTied ? `T${pos}` : pos}
                    </TableCell>

                    <TableCell class="font-medium">{row.teamName}</TableCell>

                    <TableCell class="text-right">
                      {netScore === 0
                        ? "E"
                        : netScore < 0
                        ? netScore
                        : `+${netScore}`}
                    </TableCell>
                    <TableCell class="text-center">
                      {row.thru ? row.thru : "-"}
                    </TableCell>
                  </TableRow>
                );
              }}
            </For>
          )}
        </For>
      </TableBody>
    </Table>
  );
};

export default () => {
  const tournament = useTournamentStore(identity);

  return (
    <Route
      path="leaderboard"
      component={() => (
        <Show when={tournament().id}>
          <TournamentView>
            <Suspense>
              <Leaderboard />
            </Suspense>
          </TournamentView>
        </Show>
      )}
    />
  );
};
