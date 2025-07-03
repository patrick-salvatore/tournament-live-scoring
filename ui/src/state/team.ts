import { createSignal, type Accessor, type Setter } from "solid-js";

import type { Player, PlayerId, Team } from "~/lib/team";
import type { InitFn } from "./helpers";
import { reduceToByIdMap } from "~/lib/utils";

type TeamMap = Team;
type State = TeamMap;

const inititalState = {
  id: "",
  name: "",
  displayName: "",
  tournamentId: "",
  started: false,
  finished: false,
  players: [],
} as Team;
const [store, _setStore] = createSignal<State>(inititalState);

export function useTeamStore(): {
  store: Accessor<State>;
  set: Setter<State>;
  init: (state: Team) => void;
};
export function useTeamStore<T>(selector: (s: State) => T): () => T;
export function useTeamStore<T>(selector?: (s: State) => T) {
  if (selector) {
    return () => selector(store());
  }

  const init: InitFn<Team> = (state) => _setStore(() => state);

  return { init, store, set: _setStore };
}

export const selectTeamPlayersMap = (state: State) =>
  reduceToByIdMap(state.players, "id");
