import { createStore, type SetStoreFunction } from "solid-js/store";
import type { ScoreCardWithHoles } from "~/lib/score-card";
import type { InitFn } from "./helpers";

type State = ScoreCardWithHoles[];
const [store, _setStore] = createStore<State>([]);

export function useScoreCardStore(): {
  store: State;
  set: SetStoreFunction<State>;
  init: (data: ScoreCardWithHoles[]) => void;
};
export function useScoreCardStore<T>(selector: (s: State) => T): T;
export function useScoreCardStore<T>(selector?: (s: State) => T) {
  if (selector) {
    return selector(store);
  }

  const init: InitFn<ScoreCardWithHoles[]> = (state) => _setStore(() => state);

  return { init, store, set: _setStore };
}
