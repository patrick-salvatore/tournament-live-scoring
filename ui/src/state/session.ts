import type { InitFn } from "./helpers";
import type { Session } from "~/lib/session";
import { createSignal, type Accessor, type Setter } from "solid-js";

type State = Session | null;

const [store, _setStore] = createSignal<State>(null);

export function useSessionStore(): {
  store: Accessor<State>;
  set: Setter<State>;
  init: InitFn<State>;
};
export function useSessionStore<T>(selector: (s: State) => T): () => T;
export function useSessionStore<T>(selector?: (s: State) => T) {
  if (selector) {
    return () => selector(store());
  }

  const init: InitFn<State> = (state) => _setStore(state);

  return { store, set: _setStore, init };
}
