import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  Table as TableIcon,
} from "lucide-solid";
import { unwrap } from "solid-js/store";
import {
  createMemo,
  createSignal,
  For,
  Match,
  Show,
  Suspense,
  Switch,
  type Component,
} from "solid-js";
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
import { getTeamHoles } from "~/api/teams";
import GolfScoreButton from "./golfscore";
import { cn } from "~/lib/cn";

const Scorecard = (props) => {
  const holeNumbers = createMemo(() => {
    return Object.keys(props.teamData()).sort((a, b) => +a - +b);
  });

  const players = createMemo(() => {
    const allPlayers = new Set();
    Object.values(props.teamData()).forEach((hole) => {
      Object.values(hole).forEach((player) => {
        allPlayers.add(player.playerName);
      });
    });

    return Array.from(allPlayers) as any[];
  });

  return (
    <section class="bg-gray-50 max-w-[375px] relative border overflow-scroll no-scrollbar flex">
      <div class="flex flex-col h-full min-w-[80px] text-center font-medium text-sm sticky left-0 bg-white z-20 border-r">
        <div class="flex flex-col gap-1 bg-white text-center font-medium text-sm min-w-[60px] border-b">
          <div class="p-2">
            <span class="text-[10px] transform flex items-center">Hole</span>
            <span class="text-[10px] transform flex items-center">Par</span>
          </div>
        </div>
        <For each={players()}>
          {(playerName, i) => (
            <div
              class={cn(
                "grid grid-cols-2 justify-center items-center min-h-[82px] min-w-[80px] pl-2 gap-2",
                i() < players().length - 1 && "border-b"
              )}
            >
              <div class="flex min-w-[40px] text-xs">{playerName}</div>

              <div class="flex flex-col min-h-[81px] justify-around items-center">
                <span class="text-[10px] transform -rotate-90">gross</span>
                <span class="text-[10px] transform -rotate-90">net</span>
              </div>
            </div>
          )}
        </For>
      </div>
      <div>
        <div class="h-min grid grid-cols-[repeat(19,1fr)] bg-white">
          <For each={holeNumbers()}>
            {(holeNumber) => (
              <div class="flex flex-col gap-1 bg-white p-2 text-center font-medium text-sm min-w-[60px] border-b">
                <span class="text-xs">{holeNumber}</span>
                <span class="text-[10px]">{props.pars()[holeNumber]?.par}</span>
              </div>
            )}
          </For>
        </div>

        <div class="grid grid-cols-[repeat(18,1fr)]">
          <For each={players()}>
            {(playerName, i) => (
              <For each={holeNumbers()}>
                {(holeNumber) => {
                  const holeData = props.teamData()[holeNumber]
                    ? (Object.values(props.teamData()[holeNumber]).find(
                        (p: any) => p.playerName === playerName
                      ) as any)
                    : null;

                  const strokeHole = holeData.strokeHole;
                  const score = holeData.score;
                  const par = holeData.par;

                  return (
                    <div
                      class={cn(
                        "text-center text-sm min-w-[60px] gap-3",
                        i() < players().length - 1 && "border-b"
                      )}
                    >
                      <div class="flex justify-center items-center min-h-[10px] gap-1">
                        {strokeHole
                          ? Array(strokeHole)
                              .fill(null)
                              .map(() => (
                                <div class="w-1 h-1 bg-red-500 rounded-full flex items-center justify-center"></div>
                              ))
                          : null}
                      </div>
                      <div class="font-medium min-h-[40px] flex justify-center items-center">
                        {score && <GolfScoreButton score={+score} par={par} />}
                      </div>
                      <hr />
                      <div class="text-xs font-medium min-h-[30px] flex justify-center items-center">
                        {score && strokeHole
                          ? +score - strokeHole
                          : score
                          ? +score
                          : ""}
                      </div>
                    </div>
                  );
                }}
              </For>
            )}
          </For>
        </div>
      </div>
    </section>
  );
};

const MatchPlayLeaderboard = () => {
  const session = useSessionStore(identity);
  const [expandedRow, setExpandedRow] = createSignal({});

  const holesQuery = useQuery<Hole[]>(() => ({
    queryKey: ["leaderboard", "holes", "matchplay"],
    queryFn: () => getHolesForLeaderboard(session()?.tournamentId!),
    initialData: [],
    // refetchInterval: TEN_SECONDS,
  }));

  const holesPerTeam = createMemo(() => {
    const scoresPerHole = holesQuery.data.reduce((acc, hole) => {
      if (!acc[hole.teamId]) {
        acc[hole.teamId] = {};
      }

      if (!acc[hole.teamId][hole.number]) {
        acc[hole.teamId][hole.number] = {};
      }

      if (!acc[hole.teamId][hole.number][hole.playerId]) {
        acc[hole.teamId][hole.number][hole.playerId] = unwrap(hole);
      }

      return acc;
    }, {});

    return scoresPerHole;
  });

  const pars = createMemo(() => {
    return holesQuery.data.reduce((acc, hole) => {
      if (!acc[hole.number]) {
        acc[hole.number] = hole;
      }

      return acc;
    }, {});
  });

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
        id: teamAId,
        score: teamAFinalScore,
        name: [...(teams?.[teamAId] ?? [])]
          .sort((a, b) => (a > b ? -1 : 1))
          .join(", "),
      },
      teamB: {
        id: teamBId,
        score: teamBFinalScore,
        name: [...(teams?.[teamBId] ?? [])]
          .sort((a, b) => (a > b ? -1 : 1))
          .join(", "),
      },
      thruCount: Object.keys(winners).length,
    };
  });

  const toggleRow = (teamId) => {
    setExpandedRow((prev) => ({
      ...prev,
      [teamId]: prev[teamId] ? !prev[teamId] : true,
    }));
  };

  return (
    <Show when={leaderboard()}>
      <Table id="MatchPlayLeaderboard">
        <TableHeader>
          <TableRow>
            <TableHead class="w-auto"></TableHead>
            <TableHead>Team</TableHead>
            <TableHead class="text-right">-</TableHead>
            <TableHead class="text-center">Thru</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-medium w-auto px-0">
              <button
                onClick={() => toggleRow(leaderboard().teamA?.id)}
                class="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                {expandedRow()[leaderboard().teamA?.id] ? (
                  <Minus size={12} />
                ) : (
                  <Plus size={12} />
                )}
                <TableIcon size={14} />
              </button>
            </TableCell>
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
          <Show when={expandedRow()[leaderboard().teamA?.id]}>
            <TableRow>
              <TableCell colspan="4" class="p-0">
                <Scorecard
                  pars={pars}
                  teamData={() =>
                    holesPerTeam()?.[leaderboard().teamA?.id] ?? {}
                  }
                />
              </TableCell>
            </TableRow>
          </Show>
          <TableRow>
            <TableCell class="font-medium w-auto px-0">
              <button
                onClick={() => toggleRow(leaderboard().teamB?.id)}
                class="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                {expandedRow()[leaderboard().teamB?.id] ? (
                  <Minus size={12} />
                ) : (
                  <Plus size={12} />
                )}
                <TableIcon size={14} />
              </button>
            </TableCell>
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
          <Show when={expandedRow()[leaderboard().teamB?.id]}>
            <TableRow>
              <TableCell colspan="4" class="p-0">
                <Scorecard
                  pars={pars}
                  teamData={() =>
                    holesPerTeam()?.[leaderboard().teamB?.id] || {}
                  }
                />
              </TableCell>
            </TableRow>
          </Show>
        </TableBody>
      </Table>
    </Show>
  );
};

export default MatchPlayLeaderboard;
