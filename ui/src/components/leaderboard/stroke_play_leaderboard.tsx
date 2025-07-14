import { Minus, Plus, Table as TableIcon } from "lucide-solid";
import { unwrap } from "solid-js/store";
import { createMemo, createSignal, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";

import type { Leaderboard } from "~/lib/leaderboard";
import { getLeaderboard } from "~/api/leaderboard";
import { useSessionStore } from "~/state/session";
import { identity } from "~/state/helpers";
import { groupByIdMap, reduceToByIdMap } from "~/lib/utils";
import type { Hole } from "~/lib/hole";
import { getTeamHoles } from "~/api/teams";
import GolfScoreButton from "./golfscore";
import { cn } from "~/lib/cn";
import { useCourseStore } from "~/state/course";

export const teamHoleLeaderboardQueryKey = (teamId) => [
  "leaderboard",
  "holes",
  "team",
  teamId,
];

const LeaderboardScorecard = (props) => {
  const course = useCourseStore(identity);

  const holesQuery = useQuery<Hole[]>(() => ({
    queryKey: teamHoleLeaderboardQueryKey(props.teamId),
    queryFn: () => getTeamHoles(props.teamId),
    initialData: [],
  }));

  const courseHoles = createMemo(() => {
    return reduceToByIdMap(course().holes, "number");
  });

  const holesPerPlayer = createMemo(() => {
    const scoresPerHole = holesQuery.data.reduce((acc, hole) => {
      if (!acc[hole.number]) {
        acc[hole.number] = {};
      }

      if (!acc[hole.number][hole.playerName]) {
        acc[hole.number][hole.playerName] = {
          ...hole,
          ...courseHoles()[hole.number],
        };
      }

      return acc;
    }, {});

    return scoresPerHole as Record<
      string,
      Record<string, Hole & { par: number; handicap: number }>
    >;
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
                <span class="text-[10px]">
                  {courseHoles()[holeNumber]?.par}
                </span>
              </div>
            )}
          </For>
        </div>

        <div class="grid grid-cols-[repeat(18,1fr)]">
          <For each={players()}>
            {(playerName, i) => (
              <For each={holeNumbers()}>
                {(holeNumber) => {
                  const holeData = holesPerPlayer()[holeNumber][playerName];

                  const strokeHole = () => holeData.strokeHole;
                  const score = () => holeData.score;
                  const par = () => holeData.par;

                  return (
                    <div
                      class={cn(
                        "text-center text-sm min-w-[60px] gap-3",
                        i() < players().length - 1 && "border-b"
                      )}
                    >
                      <div class="flex justify-center items-center min-h-[10px] gap-1">
                        {strokeHole()
                          ? Array(strokeHole())
                              .fill(null)
                              .map(() => (
                                <div class="w-1 h-1 bg-red-500 rounded-full flex items-center justify-center"></div>
                              ))
                          : null}
                      </div>
                      <div class="font-medium min-h-[40px] flex justify-center items-center">
                        {score() && <GolfScoreButton score={+score()} par={par()} />}
                      </div>
                      <hr />
                      <div class="text-xs font-medium min-h-[30px] flex justify-center items-center">
                        {score() && strokeHole()
                          ? +score() - strokeHole()
                          : score()
                          ? +score()
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

const StrokePlayLeaderboard = () => {
  const [expandedRow, setExpandedRow] = createSignal({});
  const session = useSessionStore(identity);

  const leaderboardQuery = useQuery<Leaderboard>(() => ({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(session()?.tournamentId!),
    initialData: [],
    // refetchInterval: TEN_SECONDS,
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
    <section class="min-w-[365px] max-w-[365px]">
      <div class="h-min grid grid-cols-[50px_1fr_120px_1fr_1fr]">
        <span class="flex items-center h-10 text-sm px-2 font-medium text-muted-foreground">
          {" "}
        </span>
        <span class="flex items-center h-10 text-sm px-2 font-medium text-muted-foreground">
          Pos.
        </span>
        <span class="flex items-center h-10 text-sm px-2 font-medium text-muted-foreground">
          Team
        </span>
        <span class="flex items-center h-10 text-sm px-2 font-medium text-muted-foreground justify-end">
          Net
        </span>
        <span class="flex items-center h-10 text-sm px-2 font-medium text-muted-foreground">
          Thru
        </span>
      </div>
      <div>
        <For each={leaderboard()}>
          {([, teams], position) => (
            <For each={teams}>
              {(row) => {
                const isTied = teams.length > 1;
                const pos = position() + 1;
                const netScore = row.netScore;

                return (
                  <>
                    <div class="grid grid-cols-[50px_1fr_120px_1fr_1fr]">
                      <span class="text-sm p-2 align-middle font-medium w-auto px-0 items-center flex">
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
                      </span>
                      <span class="text-sm p-2 align-middle font-medium">
                        {isTied ? `T${pos}` : pos}
                      </span>

                      <span class="text-sm p-2 align-middle font-medium">
                        {row.teamName}
                      </span>

                      <span class="text-sm p-2 align-middle font-medium text-right">
                        {netScore === 0
                          ? "E"
                          : netScore < 0
                          ? netScore
                          : `+${netScore}`}
                      </span>
                      <span class="text-sm p-2 align-middle font-medium text-center">
                        {row.thru ? row.thru : "-"}
                      </span>
                    </div>

                    <Show when={expandedRow()[row.teamId]}>
                      <LeaderboardScorecard teamId={row.teamId} />
                    </Show>
                  </>
                );
              }}
            </For>
          )}
        </For>
      </div>
    </section>
  );
};

export default StrokePlayLeaderboard;
