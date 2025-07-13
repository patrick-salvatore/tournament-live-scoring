import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-solid";
import { unwrap } from "solid-js/store";
import { createMemo, For, Match, Show, Suspense, Switch } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { Route } from "@solidjs/router";

import type { Leaderboard } from "~/lib/leaderboard";
import { getHolesForLeaderboard, getLeaderboard } from "~/api/leaderboard";
import { useSessionStore } from "~/state/session";
import { identity } from "~/state/helpers";
import { groupByIdMap } from "~/lib/utils";
import TournamentView from "~/components/tournament_view";
import { useTournamentStore } from "~/state/tournament";
import type { Hole } from "~/lib/hole";

const TEN_SECONDS = 10 * 1000;

const Leaderboard = () => {
  const session = useSessionStore(identity);

  const holesQuery = useQuery(() => ({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(session()?.tournamentId!),
    initialData: [],
    refetchInterval: TEN_SECONDS,
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

const MatchPlayLeaderboard = () => {
  const session = useSessionStore(identity);

  const holesQuery = useQuery<Hole[]>(() => ({
    queryKey: ["leaderboard", "holes", "matchplay"],
    queryFn: () => getHolesForLeaderboard(session()?.tournamentId!),
    initialData: [],
    refetchInterval: TEN_SECONDS,
  }));

  const leaderboard = createMemo(() => {
    if (!holesQuery.data.length) return {};

    const teams = {};

    const map = unwrap(holesQuery.data).reduce((acc, hole) => {
      if (!teams[hole.teamId]) {
        teams[hole.teamId] = new Set();
      }
      teams[hole.teamId].add(hole.playerName);

      if (!acc[hole.number]) {
        acc[hole.number] = [];
      }

      acc[hole.number].push(hole);

      return acc;
    }, {});

    const [teamAId, teamBId] = Object.keys(teams) as any;

    const _holes = Object.values(map);

    let winners = {};

    for (let i = 0; i < _holes.length; i++) {
      const holes = (_holes[i] as any)
        .filter((h) => h.score)
        .sort((a, b) =>
          +b.score - b.strokeHole > +a.score - a.strokeHole ? -1 : 1
        );

      if (holes.length !== 4) {
        break;
      }

      if (!winners[i]) {
        winners[i] = {};
      }

      winners[i][teamAId] = holes.find((h) => h.teamId == teamAId);
      winners[i][teamBId] = holes.find((h) => h.teamId == teamBId);
    }

    let holesWon = 0;
    for (let i = 0; i < 17; i++) {
      if (!winners[i]) {
        break;
      }
      const teamA = winners[i][teamAId];
      const teamB = winners[i][teamBId];

      const teamAScore = +teamA.score - teamA.strokeHole;
      const teamBScore = +teamB.score - teamB.strokeHole;

      if (teamAScore < teamBScore) {
        holesWon++;
      }
      if (teamAScore > teamBScore) {
        holesWon--;
      }
    }

    let teamAFinalScore;
    if (holesWon == 0) {
      teamAFinalScore = `Ev`;
    } else if (holesWon > 0) {
      teamAFinalScore = (
        <span class="flex gap-3 items-center justify-end">
          {Math.abs(holesWon)} <ArrowUp size={16} class="text-green-600" />
        </span>
      );
    } else {
      teamAFinalScore = (
        <span class="flex gap-3 items-center justify-end">
          {Math.abs(holesWon)} <ArrowDown size={16} class="text-red-600" />
        </span>
      );
    }

    let teamBFinalScore;
    if (holesWon == 0) {
      teamBFinalScore = `Ev`;
    } else if (holesWon < 0) {
      teamBFinalScore = (
        <span class="flex gap-3 items-center justify-end">
          {Math.abs(holesWon)} <ArrowUp size={16} class="text-green-600" />
        </span>
      );
    } else {
      teamBFinalScore = (
        <span class="flex gap-3 items-center justify-end">
          {Math.abs(holesWon)} <ArrowDown size={16} class="text-red-600" />
        </span>
      );
    }

    return {
      teamA: {
        score: teamAFinalScore,
        name: [...(teams?.[teamAId] ?? [])]
          .sort((a, b) => (a > b ? -1 : 1))
          .join(", "),
      },
      teamB: {
        score: teamBFinalScore,
        name: [...(teams?.[teamBId] ?? [])]
          .sort((a, b) => (a > b ? -1 : 1))
          .join(", "),
      },
      thruCount: Object.keys(winners).length,
    };
  });

  return (
    <Show when={leaderboard()}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead class="text-right">-</TableHead>
            <TableHead class="text-center">Thru</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-medium">
              {leaderboard().teamA?.name}
            </TableCell>
            <TableCell class="font-medium text-right">
              {leaderboard().teamA?.score}
            </TableCell>
            <TableCell class="font-medium text-center">
              {leaderboard().thruCount}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">
              {leaderboard().teamB?.name}
            </TableCell>
            <TableCell class="font-medium text-right">
              {leaderboard().teamB?.score}
            </TableCell>
            <TableCell class="font-medium text-center">
              {leaderboard().thruCount}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Show>
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
              <Switch>
                <Match when={tournament().isMatchPlay}>
                  <MatchPlayLeaderboard />
                </Match>
                <Match when={true}>
                  <Leaderboard />
                </Match>
              </Switch>
            </Suspense>
          </TournamentView>
        </Show>
      )}
    />
  );
};
