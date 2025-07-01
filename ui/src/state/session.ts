import { createSignal } from "solid-js";

import type { Session } from "~/lib/session";

import type { InitFn } from "./helpers";

type State = Partial<Session>;

const [store, _setStore] = createSignal<State>({});

export function useSessionStore<T>() {
  return { set: _setStore, session: store };
}
