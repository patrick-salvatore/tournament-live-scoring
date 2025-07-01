import { createStore, type SetStoreFunction } from "solid-js/store";

import type { Player } from "~/lib/player";
import type { InitFn } from "./helpers";
import { reduceToByIdMap } from "~/lib/utils";

type State = Record<string, Player>;

const [store, _setStore] = createStore<State>({});

export function usePlayerStore(): {
  store: State;
  set: SetStoreFunction<State>;
  init: InitFn<Player[]>;
};
export function usePlayerStore<T>(selector: (s: State) => T): T;
export function usePlayerStore<T>(selector?: (s: State) => T) {
  if (selector) {
    return selector(store);
  }

  const init: InitFn<Player[]> = (state) =>
    _setStore(() => reduceToByIdMap(state, "id"));

  return { init, set: _setStore, store };
}

export const selectPlayerList = (state: State) => Object.values(state);
