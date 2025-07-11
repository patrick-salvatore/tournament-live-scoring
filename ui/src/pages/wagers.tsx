import {
  Table,
  TableBody,
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

const WagerLeaderboard = () => {
  const session = useSessionStore(identity);

  const holesQuery = useQuery<Leaderboard>(() => ({
    queryKey: ["wager", "leaderboard"],
    queryFn: () => getLeaderboard(session()?.tournamentId!, true),
    initialData: [],
  }));

  const leaderBoard = createMemo(() => {
    const groupByScore = groupByIdMap(holesQuery.data, "netScore");

    const sortedRows = Object.entries(groupByScore)
      .sort((a, b) => {
        return +a[0] > +b[0] ? 1 : -1;
      })
      .map((row) => {
        const sortedByName = row[1]
          .sort((a, b) => (a.teamName > b.teamName ? -1 : 1))
          .sort((a, b) => (a.thru > b.thru ? -1 : 1));
        return [row[0], sortedByName];
      });

    return sortedRows as any[];
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pos.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead class="text-right">Gross</TableHead>
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
                const grossScore = row.grossScore;

                return (
                  <TableRow>
                    <TableCell class="font-medium">
                      {isTied ? `T${pos}` : pos}
                    </TableCell>

                    <TableCell class="font-medium">{row.teamName}</TableCell>

                    <TableCell class="text-right">
                      {grossScore === 0
                        ? "E"
                        : grossScore < 0
                        ? grossScore
                        : `+${grossScore}`}
                    </TableCell>
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
      path="/wagers"
      component={() => (
        <Show when={tournament().id}>
          <TournamentView>
            <Suspense>
              <WagerLeaderboard />
            </Suspense>
          </TournamentView>
        </Show>
      )}
    />
  );
};
