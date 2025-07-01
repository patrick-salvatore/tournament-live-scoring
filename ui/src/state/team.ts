import { createStore, type SetStoreFunction } from "solid-js/store";

import type { Team } from "~/lib/team";
import type { InitFn } from "./helpers";

type State = Team;

const inititalState = { id: "", name: "", displayName: "", tournamentId: "" };
const [store, _setStore] = createStore<State>(inititalState);

export function useTeamStore(): {
  store: State;
  set: SetStoreFunction<State>;
  init: (state: State) => void;
};
export function useTeamStore<T>(selector: (s: State) => T): T;
export function useTeamStore<T>(selector?: (s: State) => T) {
  if (selector) {
    return selector(store);
  }

  const init: InitFn<State> = (state) => _setStore(() => state);

  return { init, store, set: _setStore };
}
