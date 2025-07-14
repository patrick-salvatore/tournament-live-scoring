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

const TEN_SECONDS = 10 * 1000;

const GolfScoreButton: Component<{
  score: number;
  par: number;
  class?: string;
}> = (props) => {
  const diff = Number(props.score) - props.par;

  const scoreType = (() => {
    if (diff === -3) return "albatross";
    if (diff == -2) return "eagle";
    if (diff === -1) return "birdie";
    if (diff === 0) return "par";
    if (diff === 1) return "bogey";
    if (diff === 2) return "double-bogey";
    if (diff >= 3) return "triple-plus";
    return;
  })();

  const getButtonStyles = () => {
    const baseStyles =
      "text-sm font-bold flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 border-gray-600";

    switch (scoreType) {
      case "albatross":
        return `${baseStyles} rounded-full border-1`;

      case "eagle":
        return `${baseStyles} rounded-full border-1`;

      case "birdie":
        return `${baseStyles} rounded-full border-1`;

      case "bogey":
        return `${baseStyles} rounded-none border-1`;

      case "double-bogey":
        return `${baseStyles} rounded-none border-1`;

      case "triple-plus":
        return `${baseStyles} rounded-none border-1`;

      default:
        return baseStyles;
    }
  };

  const renderInnerBorders = () => {
    if (scoreType === "albatross") {
      return (
        <>
          <div class="absolute rounded-full inset-1 border-1 border-gray-600 pointer-events-none" />
          <div class="absolute rounded-full inset-2 border-1 border-gray-600 pointer-events-none" />
        </>
      );
    }
    if (scoreType === "eagle") {
      return (
        <div class="absolute rounded-full inset-1 border-1 border-gray-600 pointer-events-none" />
      );
    }
    if (scoreType === "double-bogey") {
      return (
        <div class="absolute inset-1 border-1 border-gray-600 pointer-events-none rounded-none" />
      );
    }
    if (scoreType === "triple-plus") {
      return (
        <>
          <div class="absolute inset-1 border-1 border-gray-600 pointer-events-none rounded-none" />
          <div class="absolute inset-2 border-1 border-gray-500 pointer-events-none rounded-none" />
        </>
      );
    }
    return null;
  };

  return props.par == 5 && props.score == 1 ? null : (
    <div class={`${getButtonStyles()} ${props.class || ""} relative`}>
      {renderInnerBorders()}

      <span class="relative px-3 py-2">{props.score}</span>
    </div>
  );
};

const LeaderboardScorecard = (props) => {
  const holesQuery = useQuery<Hole[]>(() => ({
    queryKey: ["leaderboard", "holes", "team", props.teamId],
    queryFn: () => getTeamHoles(props.teamId),
    initialData: [],
    refetchInterval: TEN_SECONDS,
  }));

  const holesPerPlayer = createMemo(() => {
    const scoresPerHole = holesQuery.data.reduce((acc, hole) => {
      if (!acc[hole.number]) {
        acc[hole.number] = {};
      }

      if (!acc[hole.number][hole.playerName]) {
        acc[hole.number][hole.playerName] = unwrap(hole);
      }

      return acc;
    }, {});

    return scoresPerHole as Record<string, Record<string, Hole>>;
  });

  const pars = createMemo(() => {
    return holesQuery.data.reduce((acc, hole) => {
      if (!acc[hole.number]) {
        acc[hole.number] = hole;
      }

      return acc;
    }, {});
  });

  const holeNumbers = createMemo(() => {
    return Object.keys(holesPerPlayer()).sort((a, b) => +a - +b);
  });

  const players = createMemo(() => {
    const allPlayers = Object.values(holesPerPlayer()).flatMap((value) =>
      Object.keys(value)
    );

    return Array.from(new Set(allPlayers)) as any[];
  });

  return (
    <div class="border-t bg-gray-50">
      <div class="w-full max-w-screen-md relative overflow-auto">
        <Table>
          <TableHeader>
            <TableRow class="border-b bg-white">
              <TableHead class="border-r p-2 text-center font-medium text-sm min-w-[60px] sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <div class="flex flex-col">
                  <span class="text-[10px] transform flex items-center">
                    Hole
                  </span>
                  <span class="text-[10px] transform flex items-center">
                    Par
                  </span>
                </div>
              </TableHead>
              <For each={holeNumbers()}>
                {(holeNumber) => (
                  <>
                    <TableHead class="border-r p-2 text-center font-medium text-sm min-w-[60px]">
                      <div class="flex flex-col">
                        <span class="text-xs">{holeNumber}</span>
                        <span class="text-[10px]">
                          {pars()[holeNumber]?.par}
                        </span>
                      </div>
                    </TableHead>
                  </>
                )}
              </For>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={players()}>
              {(playerName) => (
                <TableRow class="border-b hover:bg-gray-50">
                  <TableCell class="px-0 border-r pl-2 font-medium text-sm sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div class="min-w-[75px] min-h-[70px] flex items-center justify-between height">
                      <span>{playerName}</span>

                      <div class="min-h-[70px] gap-5 flex flex-col items-center justify-end ml-2">
                        <span class="text-[10px] transform -rotate-90 whitespace-nowrap flex items-center">
                          gross
                        </span>
                        <span class="text-[10px] transform -rotate-90 whitespace-nowrap flex items-center">
                          net
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <For each={holeNumbers()}>
                    {(holeNumber) => {
                      const holeData = holesPerPlayer()[holeNumber][playerName];

                      const strokeHole = holeData.strokeHole;
                      const score = holeData.score;
                      const par = holeData.par;

                      return (
                        <TableCell class="p-0 border-r text-center text-sm min-w-[60px] gap-3">
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
                            {score && (
                              <GolfScoreButton score={+score} par={par} />
                            )}
                          </div>
                          <hr />
                          <div class="text-xs font-medium min-h-[30px] flex justify-center items-center">
                            {score && strokeHole
                              ? +score - strokeHole
                              : score
                              ? +score
                              : ""}
                          </div>
                        </TableCell>
                      );
                    }}
                  </For>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const [expandedRow, setExpandedRow] = createSignal({});
  const session = useSessionStore(identity);

  const leaderboardQuery = useQuery<Leaderboard>(() => ({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(session()?.tournamentId!),
    initialData: [],
    refetchInterval: TEN_SECONDS,
  }));

  const leaderboard = createMemo(() => {
    const groupByScore = groupByIdMap(leaderboardQuery.data, "netScore");

    return Object.entries(groupByScore).sort((a, b) => {
      return +a[0] > +b[0] ? 1 : -1;
    });
  });

  const toggleRow = (teamId) => {
    setExpandedRow((prev) => ({
      ...prev,
      [teamId]: prev[teamId] ? !prev[teamId] : true,
    }));
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead> </TableHead>
          <TableHead>Pos.</TableHead>
          <TableHead>Team</TableHead>
          <TableHead class="text-right">Net</TableHead>
          <TableHead class="text-center">Thru</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={leaderboard()}>
          {([, teams], position) => (
            <For each={teams}>
              {(row) => {
                const isTied = teams.length > 1;
                const pos = position() + 1;
                const netScore = row.netScore;

                return (
                  <>
                    <TableRow>
                      <TableCell class="font-medium w-auto px-0">
                        <button
                          onClick={() => toggleRow(row.teamId)}
                          class="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {expandedRow()[row.teamId] ? (
                            <Minus size={12} />
                          ) : (
                            <Plus size={12} />
                          )}
                          <TableIcon size={14} />
                        </button>
                      </TableCell>
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
                    <Show when={expandedRow()[row.teamId]}>
                      <TableRow>
                        <TableCell colspan="4" class="p-0">
                          <LeaderboardScorecard teamId={row.teamId} />
                        </TableCell>
                      </TableRow>
                    </Show>
                  </>
                );
              }}
            </For>
          )}
        </For>
      </TableBody>
    </Table>
  );
};

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
    <div class="border-t bg-gray-50">
      <div class="w-full max-w-screen-md relative overflow-auto">
        <Table>
          <TableHeader>
            <TableRow class="border-b bg-white">
              <TableHead class="border-r p-2 text-center font-medium text-sm min-w-[60px] sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <div class="flex flex-col">
                  <span class="text-[10px] transform flex items-center">
                    Hole
                  </span>
                  <span class="text-[10px] transform flex items-center">
                    Par
                  </span>
                </div>
              </TableHead>
              <For each={holeNumbers()}>
                {(holeNumber) => (
                  <>
                    <TableHead class="border-r p-2 text-center font-medium text-sm min-w-[60px]">
                      <div class="flex flex-col">
                        <span class="text-xs">{holeNumber}</span>
                        <span class="text-[10px]">
                          {props.pars()[holeNumber]?.par}
                        </span>
                      </div>
                    </TableHead>
                  </>
                )}
              </For>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={players()}>
              {(playerName) => (
                <TableRow class="border-b hover:bg-gray-50">
                  <TableCell class="px-0 border-r pl-2 font-medium text-sm sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div class="min-w-[75px] min-h-[70px] flex items-center justify-between height">
                      <span>{playerName}</span>

                      <div class="min-h-[70px] gap-5 flex flex-col items-center justify-end ml-2">
                        <span class="text-[10px] transform -rotate-90 whitespace-nowrap flex items-center">
                          gross
                        </span>
                        <span class="text-[10px] transform -rotate-90 whitespace-nowrap flex items-center">
                          net
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <For each={holeNumbers()}>
                    {(holeNumber) => {
                      const playerData = props.teamData()[holeNumber]
                        ? (Object.values(props.teamData()[holeNumber]).find(
                            (p: any) => p.playerName === playerName
                          ) as any)
                        : null;

                      return (
                        <TableCell class="p-0 border-r text-center text-sm min-w-[60px] gap-3">
                          {playerData ? (
                            <>
                              <div class="flex justify-center items-center min-h-[10px] gap-1">
                                {playerData.strokeHole
                                  ? Array(playerData.strokeHole)
                                      .fill(null)
                                      .map(() => (
                                        <div class="w-1 h-1 bg-red-500 rounded-full flex items-center justify-center"></div>
                                      ))
                                  : null}
                              </div>
                              <div class="font-medium min-h-[40px] flex justify-center items-center">
                                <GolfScoreButton
                                  score={playerData.score}
                                  par={playerData.par}
                                />
                              </div>
                              <hr />
                              <div class="text-xs font-medium min-h-[30px] flex justify-center items-center">
                                {playerData.score && playerData.strokeHole
                                  ? +playerData.score - playerData.strokeHole
                                  : +playerData.score}
                              </div>
                            </>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      );
                    }}
                  </For>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </div>
    </div>
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
