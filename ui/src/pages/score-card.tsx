import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  type Component,
} from "solid-js";
import { ChevronLeft, ChevronRight } from "lucide-solid";
import { unwrap } from "solid-js/store";
import { useQueryClient, useQuery, useMutation } from "@tanstack/solid-query";

import { Bottomsheet } from "~/components/bottom-sheet";
import { Button } from "~/components/ui/button";

import { selectPlayerList, usePlayerStore } from "~/state/player";
import { selectCourseHoles, useCourseStore } from "~/state/course";
import { identity } from "~/state/helpers";
import { useSessionStore } from "~/state/session";
import { useTournamentStore } from "~/state/tournament";

import { getStrokeHole, groupByIdMap, reduceToByIdMap } from "~/lib/utils";
import type { Score, Hole, UpdateHolePayload } from "~/lib/hole";

import { getAllTournamentHolesForTeam, updateHoleScores } from "~/api/holes";
import { Route } from "@solidjs/router";
import { useTeamStore } from "~/state/team";

interface GolfScoreButtonProps {
  score: number | string;
  par: number;
  onClick: () => void;
  class?: string;
}

const GolfScoreButton: Component<GolfScoreButtonProps> = (props) => {
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
      "text-2xl font-bold flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 border-gray-600";

    switch (scoreType) {
      case "albatross":
        return `${baseStyles} rounded-full border-2`;

      case "eagle":
        return `${baseStyles} rounded-full border-2`;

      case "birdie":
        return `${baseStyles} rounded-full border-2`;

      case "bogey":
        return `${baseStyles} rounded-none border-2`;

      case "double-bogey":
        return `${baseStyles} rounded-none border-2`;

      case "triple-plus":
        return `${baseStyles} rounded-none border-2`;

      default:
        return baseStyles;
    }
  };

  const renderInnerBorders = () => {
    if (scoreType === "albatross") {
      return (
        <>
          <div class="absolute rounded-full inset-2 border-2 border-gray-600 pointer-events-none" />
          <div class="absolute rounded-full inset-4 border-1 border-gray-600 pointer-events-none" />
        </>
      );
    }
    if (scoreType === "eagle") {
      return (
        <div class="absolute rounded-full inset-2 border-2 border-gray-600 pointer-events-none" />
      );
    }
    if (scoreType === "double-bogey") {
      return (
        <div class="absolute inset-2 border-2 border-gray-600 pointer-events-none rounded-none" />
      );
    }
    if (scoreType === "triple-plus") {
      return (
        <>
          <div class="absolute inset-2 border-2 border-gray-600 pointer-events-none rounded-none" />
          <div class="absolute inset-4 border-2 border-gray-500 pointer-events-none rounded-none" />
        </>
      );
    }
    return null;
  };

  return props.par == 5 && props.score == 1 ? null : (
    <button
      class={`${getButtonStyles()} ${props.class || ""} relative`}
      onClick={props.onClick}
    >
      {renderInnerBorders()}

      <span class="relative z-10 px-6 py-4">{props.score}</span>

      <span class="absolute bottom-1 text-xs font-normal opacity-70">
        {scoreType === "par" ? "Par" : null}
      </span>
    </button>
  );
};

type ScoreData = {
  playerId: string;
  holeIndex: number;
} | null;

type UpdateScoreFn = (data: {
  playerId: string;
  holeIndex: number;
  score: Score;
}) => void;

export type HoleScores = Record<string, Hole>;

const FIRST_HOLE = 1;
const NUM_HOLES = 18;

const ScoreCard = () => {
  const queryClient = useQueryClient();

  const players = usePlayerStore(identity);
  const session = useSessionStore(identity);
  const tournamentStore = useTournamentStore(identity);
  const playerStore = usePlayerStore(identity);
  const courseStore = useCourseStore(identity);

  const [currentHole, setCurrentHole] = createSignal(FIRST_HOLE);
  const [scoreData, setScoreData] = createSignal<ScoreData>(null);
  const [currentHoleScoreData, setCurrentHoleScoreData] =
    createSignal<HoleScores>({});
  const [showUnsavedModal, setShowUnsavedModal] = createSignal<number>();

  const getHoles = () => holes?.()?._;

  const queryKey = ["holes"];

  const holesQuery = useQuery(() => ({
    queryKey: queryKey,
    queryFn: () => {
      return getAllTournamentHolesForTeam({
        teamId: session()?.teamId!,
        tournamentId: session()?.tourneyId!,
      });
    },
    throwOnError: true,
    initialData: [],
  }));

  const saveMutation = useMutation<any, any, UpdateHolePayload[], any>(() => ({
    mutationFn: updateHoleScores,
    onMutate: async (newHoles) => {
      await queryClient.cancelQueries({ queryKey });
      const prevHole = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, newHoles);

      return { prevHole, newHoles };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(queryKey, context.newHoles);
    },
    onSettled: (_) => queryClient.invalidateQueries({ queryKey: queryKey }),
  }));

  const holes = createMemo(() => {
    let currentHole = 0;
    let isFinished = true;

    const holesWithStroke = holesQuery.data?.map((hole) => {
      const player = playerStore?.[hole.playerId];
      const awardedHandicap = tournamentStore().awardedHandicap;
      const strokeHole = getStrokeHole({
        awardedHandicap,
        holeHandicap: hole.handicap,
        playerHandicap: player?.handicap,
        slope: courseStore.slope || 130,
      });

      if (!hole.score) {
        currentHole = currentHole || hole.number;
        isFinished = false;
      }

      return { ...hole, strokeHole };
    });

    return {
      _: groupByIdMap(holesWithStroke, "number"),
      currentHole: currentHole || 1,
      isFinished: isFinished,
    };
  });

  const isHoleComplete = createMemo(() =>
    getHoles()[currentHole()]?.every((hole) => hole.score)
  );

  const allScoresEntered = createMemo(() =>
    Object.values(currentHoleScoreData()).every((data) => data.score)
  );

  const tournamentHolesMap = createMemo(() =>
    reduceToByIdMap(unwrap(getHoles()[currentHole()] || []), "playerId")
  );

  const hasUnsavedChanges = createMemo(() => {
    const originalMap = tournamentHolesMap();
    const currentData = currentHoleScoreData();

    if (!originalMap || !currentData) return false;

    return Object.keys(currentData).some((playerId) => {
      const originalScore = originalMap[playerId]?.score;
      const currentScore = currentData[playerId]?.score;

      return originalScore !== currentScore;
    });
  });

  // log
  createEffect(() => {});

  createEffect(() => {
    const _holes = getHoles();

    if (_holes[currentHole()]) {
      setCurrentHoleScoreData(
        reduceToByIdMap(unwrap(_holes?.[currentHole()]), "playerId")
      );
    }
  });

  createEffect(() => {
    const _currentHole = holes()?.currentHole;
    setCurrentHole((prev) => (prev != _currentHole ? _currentHole : prev));
  });

  const goToPreviousHole = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedModal(-1);
      return;
    }

    if (currentHole() > FIRST_HOLE) {
      setCurrentHole(currentHole() - 1);
    }
  };

  const goToNextHole = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedModal(1);
      return;
    }
    if (currentHole() < NUM_HOLES) {
      setCurrentHole(currentHole() + 1);
    }
  };

  const confirmGoToNextHole = (direction: number) => {
    setShowUnsavedModal();
    const next = NUM_HOLES + direction;
    if (FIRST_HOLE < next || next > NUM_HOLES) {
      setCurrentHole(currentHole() + direction);
    }
  };

  const cancelGoToNextHole = () => {
    setShowUnsavedModal();
  };

  const updateScore: UpdateScoreFn = ({ playerId, score }) => {
    setCurrentHoleScoreData((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], score: score },
    }));
    setScoreData(null);
  };

  const openScorePad = (playerId: string, strokeHole: boolean) => {
    setScoreData({
      playerId,
      strokeHole,
      holeIndex: currentHole(),
    });
  };

  const handleSave = () => {
    const payload = Object.values(currentHoleScoreData() || {})
      .map((data) => {
        if (!data.id) return null;
        return { id: data.id, score: data.score } as UpdateHolePayload;
      })
      .filter(Boolean) as UpdateHolePayload[];

    saveMutation?.mutate(payload);
  };

  const handleClear = () => {
    setCurrentHoleScoreData((prev) =>
      Object.entries(prev || {}).reduce(
        (acc, [key, hole]) => ({
          ...acc,
          [key]: { ...hole, score: 0 },
        }),
        {}
      )
    );
  };

  return (
    <>
      <div class=" bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousHole}
            disabled={currentHole() === FIRST_HOLE}
            class="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div class="text-center">
            <Show when={holes()?.currentHole}>
              <h2 class="text-2xl font-bold text-gray-800">
                Hole {currentHole()}
              </h2>
            </Show>
            <div class="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span>
                Par {selectCourseHoles(courseStore)[currentHole()]?.par}
              </span>
              <span>•</span>
              <span>
                Index {selectCourseHoles(courseStore)[currentHole()]?.handicap}
              </span>
            </div>
          </div>

          <button
            onClick={goToNextHole}
            disabled={currentHole() === NUM_HOLES || !isHoleComplete()}
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
                width: `${(currentHole() / NUM_HOLES) * 100}%`,
              }}
            />
          </div>
        </div>

        <Show when={holes?.()}>
          <div class="space-y-4">
            <For each={selectPlayerList(players)}>
              {(player) => {
                const isStrokeHole = () =>
                  currentHoleScoreData()?.[player.id]?.strokeHole;
                return (
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-2 relative">
                      <h3 class="font-semibold text-gray-800">{player.name}</h3>
                      <Show when={isStrokeHole()}>
                        <div class="absolute -right-5 top-0 flex items-center space-x-1">
                          <div class="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        </div>
                      </Show>
                    </div>

                    <div class="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          openScorePad(player.id, Boolean(isStrokeHole()))
                        }
                        disabled={saveMutation?.isPending}
                        class={`w-16 h-12 text-lg font-bold border-2 rounded-md transition-colors flex items-center justify-center ${
                          isStrokeHole()
                            ? "border-red-300 hover:border-red-500 bg-red-50"
                            : "border-gray-300 hover:border-blue-500"
                        } ${
                          saveMutation?.isPending
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Show
                          when={currentHoleScoreData()?.[player.id]?.score}
                          fallback={<span class="text-gray-400">—</span>}
                        >
                          {currentHoleScoreData()?.[player.id]?.score}
                        </Show>
                      </Button>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>

          <Show when={!holes().isFinished}>
            <div class="mt-6 flex space-x-3">
              <Button
                onClick={handleSave}
                disabled={!allScoresEntered() || saveMutation?.isPending}
                class="flex-1 bg-green-600  disabled:bg-green-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Show when={saveMutation?.isPending} fallback="Save Hole">
                  <div class="flex items-center space-x-2">
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                </Show>
              </Button>

              <Button
                onClick={handleClear}
                disabled={saveMutation?.isPending}
                class="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Clear
              </Button>
            </div>
          </Show>
        </Show>

        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between text-xs text-gray-600">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <span>Stroke hole</span>
            </div>
          </div>
        </div>
      </div>

      <Show when={scoreData()}>
        <Bottomsheet
          variant="snap"
          defaultSnapPoint={({ maxHeight }) => maxHeight / 2}
          snapPoints={({ maxHeight }) => [maxHeight / 2]}
          onClose={() => setScoreData(null)}
        >
          <div class="mt-6 px-4">
            <div class="grid grid-cols-3 justify-center">
              <For each={["1", "2", "3", "4", "5", "6", "7", "8", "X"]}>
                {(score, index) => {
                  const row = Math.floor(index() / 3);
                  const col = index() % 3;

                  let gridBorders = "flex justify-center p-4";
                  if (col < 2) gridBorders += " border-r-2 border-gray-400";
                  if (row < 2) gridBorders += " border-b-2 border-gray-400";

                  return (
                    <div class={gridBorders}>
                      <GolfScoreButton
                        score={score}
                        par={selectCourseHoles(courseStore)[currentHole()]?.par}
                        onClick={() => {
                          updateScore({
                            playerId: scoreData()!.playerId,
                            holeIndex: scoreData()!.holeIndex,
                            score,
                          });
                        }}
                      />
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </Bottomsheet>
      </Show>

      <Show when={showUnsavedModal() !== undefined}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">
              Unsaved Changes
            </h3>
            <p class="text-gray-600 mb-6">
              You have unsaved changes on this hole. Are you sure you want to
              continue to the next hole? Your changes will be lost.
            </p>
            <div class="flex space-x-3">
              <Button
                onClick={cancelGoToNextHole}
                class="flex-1 bg-gray-200  text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmGoToNextHole(showUnsavedModal()!)}
                class="flex-1 bg-green-600  text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

const ScoreCardRoute = () => {
  const teamStore = useTeamStore();
  const matches = createMemo(() => {
    const keys = Object.keys(teamStore.store);
    const escaped = keys.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = `^(${escaped.join("|")})$`;
    return new RegExp(pattern);
  });

  return (
    <Route
      path=":teamId/scorecard"
      component={ScoreCard}
      matchFilters={{
        teamId: matches(),
      }}
    />
  );
};

export default ScoreCardRoute;
