import z from "zod";
import { createForm, Form as _Form } from "@gapu/formix";
import { createEffect, For } from "solid-js";
import { useNavigate } from "@solidjs/router";

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
import { identity } from "~/state/helpers";
import { selectTeamById, useTeamStore } from "~/state/team";
import { startTournament } from "~/api/tournaments";

export default function Tournament() {
  const navigate = useNavigate();
  const players = usePlayerStore(selectPlayerList);
  const session = useSessionStore(identity);
  const team = useTeamStore(selectTeamById(session()?.teamId));

  const form = createForm<any, { error?: string }>({
    schema: z.any(),
    initialState: {},
    onSubmit: () => handleStartTournament(),
  });

  const handleStartTournament = async () => {
    form.setState("error", () => null);
    try {
      const _session = session();
      if (_session) {
        await startTournament(_session);
        navigate(`/tournament/${session()?.teamId}/scoreCard`, {
          replace: true,
        });
      }
    } catch (e) {
      form.setState("error", () => e);
    }
  };

  createEffect(() => {
    const _team = team();
    if (_team?.started) {
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
          <For each={players()}>
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
