import z from "zod";
import { createForm, Form as _Form } from "@gapu/formix";
import { createEffect, For } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { createScoreCardsForTeam } from "~/api/scorecards";

import { Button } from "~/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "~/components/ui/table";
import { FormError } from "~/components/ui/form";

import { useSessionStore } from "~/state/session";
import { selectPlayerList, usePlayerStore } from "~/state/player";
import { useScoreCardStore } from "~/state/score-card";
import { identity } from "~/state/helpers";

export default function Tournament() {
  const navigate = useNavigate();
  const players = usePlayerStore(identity);
  const session = useSessionStore(identity);
  const scoreCards = () => useScoreCardStore(identity);
  const { init } = useScoreCardStore();

  const form = createForm<any, { error?: string }>({
    schema: z.any(),
    initialState: {},
    onSubmit: () => startTournament(),
  });

  const startTournament = async () => {
    form.setState("error", () => null);
    try {
      if (session()?.teamId && session()?.tourneyId) {
        const scoreCards = await createScoreCardsForTeam({
          teamId: session()?.teamId!,
          tournamentId: session()?.tourneyId!,
        });
        init(scoreCards);
        navigate(`/tournament/${session()?.teamId}/scoreCard`, {
          replace: true,
        });
      }
    } catch (e) {
      form.setState("error", () => e);
    }
  };

  createEffect(() => {
    if (scoreCards().length) {
      navigate(`/tournament/${session()?.teamId}/scoreCard`, {
        replace: true,
      });
    }
  });

  return (
    <_Form context={form}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[100px]">Name</TableHead>
            <TableHead>Handicap</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <For each={selectPlayerList(players)}>
            {(player) => (
              <TableRow>
                <TableCell class="font-medium">{player.name}</TableCell>
                <TableCell>{player.handicap}</TableCell>
              </TableRow>
            )}
          </For>
        </TableBody>
      </Table>
      <div class=" my-2">
        <FormError />
        <div class="flex flex-grow justify-center my-2">
          <Button type="submit">Play</Button>
        </div>
      </div>
    </_Form>
  );
}
