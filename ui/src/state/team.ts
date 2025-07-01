import { createStore, type SetStoreFunction } from "solid-js/store";

import type { Team, Teams } from "~/lib/team";
import type { InitFn } from "./helpers";
import { reduceToByIdMap } from "~/lib/utils";

type TeamMap = Record<string, Team>;
type State = TeamMap;

const inititalState = {};
const [store, _setStore] = createStore<State>(inititalState);

export function useTeamStore(): {
  store: State;
  set: SetStoreFunction<State>;
  init: (state: Teams) => void;
};
export function useTeamStore<T>(selector: (s: State) => T): () => T;
export function useTeamStore<T>(selector?: (s: State) => T) {
  if (selector) {
    return () => selector(store);
  }

  const init: InitFn<Teams> = (state) =>
    _setStore(() => reduceToByIdMap(state, "id"));

  return { init, store, set: _setStore };
}

export const selectTeamById = (teamId?: string) => (state: State) =>
  teamId ? state[teamId] : null;
