import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  Suspense,
} from "solid-js";
import { getTournamentById, getTournaments } from "~/api/tournaments";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "~/components/ui/table";
import type { Tournament } from "~/lib/tournaments";

const TOURNAMENTS_QUERY_KEY = ["tournaments"];

import { Match, Switch } from "solid-js";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-solid";

import { Button } from "~/components/ui/button";

import type { Team } from "~/lib/team";
import { getTeamByTournamentId, getTeamHoles, updateTeam } from "~/api/teams";
import { CopyButton } from "~/components/copy_to_clipboard";
import { Route, useParams } from "@solidjs/router";
import { unwrap } from "solid-js/store";
import { updateHoles } from "~/api/holes";
import type { Bottomsheet } from "~/components/bottom_sheet";
import type { Hole, UpdateHolePayload } from "~/lib/hole";
import { groupByIdMap, reduceToByIdMap } from "~/lib/utils";
import { useCourseStore } from "~/state/course";
import type { identity } from "~/state/helpers";
import { useTeamStore, selectTeamPlayersMap } from "~/state/team";
import type { HoleScores } from "../scorecard";
import TournamentView from "~/components/tournament_view";
import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { getLeaderboard, getHolesForLeaderboard } from "~/api/leaderboard";
import type { useSessionStore } from "~/state/session";

const FIRST_HOLE = 1;
const NUM_HOLES = 18;

const ScoreCard = (props) => {
  const queryClient = useQueryClient();

  const [currentHoleNumber, setCurrentHoleNumber] = createSignal(FIRST_HOLE);

  const [currentHoleScoreData, setCurrentHoleScoreData] =
    createSignal<HoleScores>({});

  const queryKey = ["holes"];

  const holesQuery = useQuery(() => ({
    queryKey: queryKey,
    queryFn: () => getTeamHoles(props.teamId!),
    initialData: [],
  }));

  const teamPlayers = createMemo(() => selectTeamPlayersMap(props.team));

  const holes = createMemo(() => {
    return groupByIdMap(holesQuery.data, "number");
  });

  const thruHole = createMemo(() => {
    const hole = Object.entries(holes()).find(([, hole]) =>
      unwrap(hole).find((hole) => !hole.score)
    );

    if (team().finished) {
      return NUM_HOLES;
    }

    if (hole) {
      return +hole[0];
    }

    return 1;
  });

  const courseHole = createMemo(
    () => course().holes?.[currentHoleNumber() - 1]
  );

  const hasUnsavedChanges = createMemo(() => {
    const originalHoles = holes()?.[currentHoleNumber()];
    const currentData = currentHoleScoreData();

    if (!originalHoles || !currentData) return false;
    return (
      originalHoles.some((hole) => {
        const currentScore = currentData[hole.playerId]?.score;
        const originalScore = hole.score;
        return currentScore && originalScore !== currentScore;
      }) && currentHoleNumber() <= thruHole()
    );
  });

  createEffect(() => {
    setCurrentHoleNumber(thruHole());
  });

  createEffect(async () => {
    const playerHoles = holes()[currentHoleNumber()];

    if (playerHoles) {
      setCurrentHoleScoreData(reduceToByIdMap(playerHoles, "playerId"));
    }
  });

  const goToPreviousHole = () => {
    if (hasUnsavedChanges()) {
      return;
    }

    if (courseHole().number > FIRST_HOLE) {
      setCurrentHoleNumber(currentHoleNumber() - 1);
    }
  };

  const goToNextHole = () => {
    if (hasUnsavedChanges()) {
      return;
    }
    if (currentHoleNumber() < NUM_HOLES) {
      setCurrentHoleNumber(currentHoleNumber() + 1);
    }
  };

  return (
    <>
      <div class=" bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousHole}
            disabled={courseHole().number === FIRST_HOLE}
            class="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div class="text-center">
            <Show when={courseHole()}>
              <h2 class="text-2xl font-bold text-gray-800">
                Hole {courseHole().number}
              </h2>
            </Show>

            <div class="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span>Par {courseHole()?.par}</span>
              <span>•</span>
              <span>Index {courseHole()?.handicap}</span>
            </div>
          </div>

          <button
            onClick={goToNextHole}
            disabled={courseHole().number === NUM_HOLES}
            class="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div class="mb-6">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Hole 1</span>
            <span>Hole {NUM_HOLES}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(courseHole().number / NUM_HOLES) * 100}%`,
              }}
            />
          </div>
        </div>

        <div class="mb-4 rounded-lg">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <span>Stroke hole</span>
            </div>
          </div>
        </div>

        <Show when={holes()}>
          <div class="space-y-4">
            <For each={Object.entries(currentHoleScoreData())}>
              {([playerId, hole]) => {
                const player = teamPlayers()?.[playerId];

                return (
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-2 relative">
                      <h3 class="font-semibold text-gray-800">{player.name}</h3>
                      <Show when={hole.strokeHole}>
                        <div
                          class={`flex space-x-1 items-center align-top relative -top-1`}
                        >
                          {Array(hole.strokeHole)
                            .fill(null)
                            .map(() => (
                              <div class="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                              </div>
                            ))}
                        </div>
                      </Show>
                    </div>

                    <div class="flex items-center space-x-2">
                      <Show
                        when={hole?.score}
                        fallback={<span class="text-gray-400">—</span>}
                      >
                        {hole?.score}
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </>
  );
};

const TEN_SECONDS = 10 * 1000;

const Leaderboard = (props) => {
  const holesQuery = useQuery(() => ({
    queryKey: ["leaderboard"],
    queryFn: () => getHolesForLeaderboard(props.tournament.id!),
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

const MatchPlayLeaderboard = (props) => {
  const holesQuery = useQuery<Hole[]>(() => ({
    queryKey: ["leaderboard", "holes", "matchplay"],
    queryFn: () => getHolesForLeaderboard(props.tournament.id!),
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

const TournamentPanel = () => {
  const [tab, setTab] = createSignal<string>();
  const [viewTeam, setViewTeam] = createSignal();
  const params = useParams();

  const handleTabChange = setTab;

  const tournamentsQuery = useQuery<Tournament>(() => ({
    queryKey: TOURNAMENTS_QUERY_KEY,
    queryFn: () => getTournamentById(params.tournamentId),
    initialData: {} as Tournament,
  }));

  return (
    <Tabs value={tab() || "create"} onChange={handleTabChange}>
      <TabsList>
        <TabsTrigger class="z-5" value="edit">
          Score
        </TabsTrigger>
        <TabsTrigger class="z-5" value="create">
          Create
        </TabsTrigger>
        <TabsIndicator variant="underline" />
      </TabsList>

      <Suspense>
        <TabsContent value="leaderboard">
          <Switch>
            <Match when={tournamentsQuery.data.isMatchPlay}>
              <MatchPlayLeaderboard />
            </Match>
            <Match when={true}>
              <Leaderboard />
            </Match>
          </Switch>
        </TabsContent>
        <TabsContent value="scorecard">
          <ScoreCard />
        </TabsContent>
      </Suspense>
    </Tabs>

    //  <Tabs value={currentTab()} onChange={handleTabChange}>
    //         <TabsList>
    //           <TabsTrigger class="z-5" value="scorecard">
    //             Score Card
    //           </TabsTrigger>
    //           <TabsTrigger class="z-5" value="leaderboard">
    //             Leaderboard
    //           </TabsTrigger>
    //           {/* <TabsTrigger class="z-5" value="wagers">
    //             Wagers
    //           </TabsTrigger> */}
    //         </TabsList>

    //         <Suspense>

    //           {/* <TabsContent value="wagers">{props.children}</TabsContent> */}
    //         </Suspense>
    //       </Tabs>
  );
};

export default () => {
  return <Route path="/:tournamentId" component={() => <TournamentPanel />} />;
};
