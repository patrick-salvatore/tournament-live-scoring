import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { createMemo, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { getLeaderboard } from "~/api/leaderboard";
import { useSessionStore } from "~/state/session";
import { identity } from "~/state/helpers";
import { groupByIdMap } from "~/lib/utils";

const Leaderboard = () => {
  const session = useSessionStore(identity);

  const holesQuery = useQuery(() => ({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(session()?.tourneyId!),
    throwOnError: true,
    initialData: [],
    refetchInterval: 10 * 1000,
  }));

  const leaderBoard = createMemo(() => {
    const sortedByName = holesQuery.data.sort((a, b) =>
      a.teamName < b.teamName ? 1 : -1
    );
    const groupByScore = groupByIdMap(sortedByName, "netScore");

    return Object.entries(groupByScore);
  });

  return (
    <Table>
      <TableCaption>Live team leaderboard for the tournament.</TableCaption>
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
                return (
                  <TableRow>
                    <TableCell class="font-medium">
                      {isTied ? `T${pos}` : pos}
                    </TableCell>

                    <TableCell class="font-medium">{row.teamName}</TableCell>

                    <TableCell class="text-right">
                      <Show when={row.netScore < 0} fallback="E">
                        {row.netScore}
                      </Show>
                    </TableCell>
                    <TableCell class="text-center">{row.thru}</TableCell>
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

export default Leaderboard;
