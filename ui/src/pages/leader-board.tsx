import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { createEffect, createMemo, For } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { getLeaderboard } from "~/api/leaderboard";
import { useSessionStore } from "~/state/session";
import { identity } from "~/state/helpers";
import { getStrokeHole, groupByIdMap, reduceToByIdMap } from "~/lib/utils";
import { useCourseStore } from "~/state/course";
import { usePlayerStore } from "~/state/player";
import { useTournamentStore } from "~/state/tournament";
import { useTeamStore } from "~/state/team";
import { unwrap } from "solid-js/store";

type Team = {
  name: string;
  grossScores: number[];
  netScores?: number[];
};

// const teams: Team[] = [
//   {
//     name: "Birdie Boys",
//     grossScores: [4, 5, 3, 4, 5, 4, 3, 5, 4, 5, 4, 4, 5, 3, 4, 5, 4, 4],
//     netScores: [3, 4, 2, 3, 4, 3, 2, 4, 3, 4, 3, 3, 4, 2, 3, 4, 3, 3],
//   },
//   {
//     name: "The Fore Players",
//     grossScores: [4, 4, 4, 4, 4, 4, 4, 4, 4],
//     netScores: [3, 3, 3, 3, 3, 3, 3, 3, 3],
//   },
//   {
//     name: "Mulligan Masters",
//     grossScores: [5, 6, 4, 6, 5, 5, 6],
//   },
//   {
//     name: "Shankopotamus",
//     grossScores: Array(18).fill(4),
//     netScores: Array(18).fill(3),
//   },
//   {
//     name: "Slice and Dice",
//     grossScores: [5, 5, 5, 5, 5, 5, 5, 5],
//     netScores: [4, 4, 4, 4, 4, 4, 4, 4],
//   },
// ];

const Leaderboard = () => {
  const total = (scores: number[] = []) =>
    scores.reduce((sum, s) => sum + (isNaN(s) ? 0 : s), 0);

  const holesThru = (scores: number[]) => {
    const played = scores.filter((s) => !isNaN(s));
    return played.length === 18 ? "F" : played.length.toString();
  };

  const session = useSessionStore(identity);
  const players = usePlayerStore(identity);
  const teamsStore = useTeamStore(identity);
  const tournamentStore = useTournamentStore(identity);
  const courseStore = useCourseStore(identity);

  const holesQuery = useQuery(() => ({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(session()?.tourneyId!),
    throwOnError: true,
    initialData: [],
  }));

  const teamScores = createMemo(() => {
    const teams = teamsStore();

    const teamRows = {};
    // const holesByTeam = holesQuery.data.map((hole) => ({
    //   ...hole,
    //   teamName: unwrap(teamsStore())[hole.teamId].name,
    // }));

    // groupByIdMap(holesQuery.data, "teamId");
    // const holesWithStroke = holesQuery.data?.map((hole) => {
    //   const player = players?.[hole.playerId];
    //   const awardedHandicap = tournamentStore().awardedHandicap;
    //   const strokeHole = getStrokeHole({
    //     awardedHandicap,
    //     holeHandicap: hole.handicap,
    //     playerHandicap: player?.handicap,
    //     slope: courseStore.slope,
    //   });

    //   return { ...hole, strokeHole };
    // });

    // console.log(holesByTeam);
  });

  createEffect(() => {
    const data = holesQuery.data;
    console.log(unwrap(data));
  });

  return (
    <Table>
      <TableCaption>Live team leaderboard for the tournament.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead class="text-right">Gross</TableHead>
          <TableHead class="text-right">Net</TableHead>
          <TableHead class="text-center">Thru</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* <For each={[]}>
          {(team) => (
            <TableRow>
              <TableCell class="font-medium">{team.name}</TableCell>
              <TableCell class="text-right">
                {total(team.grossScores)}
              </TableCell>
              <TableCell class="text-right">
                {team.netScores ? total(team.netScores) : "—"}
              </TableCell>
              <TableCell class="text-center">
                {holesThru(team.grossScores)}
              </TableCell>
            </TableRow>
          )}
        </For> */}
      </TableBody>
    </Table>
  );
};

export default Leaderboard;
