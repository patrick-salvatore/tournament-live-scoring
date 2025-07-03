import z from "zod";
import { createForm, Form as _Form } from "@gapu/formix";
import { createMemo, For } from "solid-js";
import { Route, useNavigate } from "@solidjs/router";

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

import { identity } from "~/state/helpers";
import { useTeamStore } from "~/state/team";
import { startTournament } from "~/api/tournaments";
import { useTournamentStore } from "~/state/tournament";

function Tournament() {
  const navigate = useNavigate();
  const team = useTeamStore(identity);
  const tournament = useTournamentStore(identity);

  const form = createForm<any, { error?: string }>({
    schema: z.any(),
    initialState: {},
    onSubmit: () => handleStartTournament(),
  });

  const handleStartTournament = async () => {
    form.setState("error", () => null);
    try {
      if (!team().started) {
        await startTournament({
          teamId: team().id,
          tournamentId: tournament().id,
        });
      }
      navigate(`/tournament/scorecard`, {
        replace: true,
      });
    } catch (e) {
      form.setState("error", () => e);
    }
  };

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
          <For each={team().players}>
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

export default () => {
  return <Route path="start" component={Tournament} />;
};
