import type { State, Action, ToastProps } from "../types";
import { ActionType } from "../types";
import { createStore, produce as p } from "solid-js/store";

const [store, setStore] = createStore<State>({
  toasts: [],
});

export const createTimers = () => {
  const now = Date.now();
  return store.toasts.map((toast) => {
    if (toast.pausedAt || toast.duration === Infinity) return;

    const durationLeft =
      (toast.duration || 0) + toast.pauseDuration - (now - toast.createdAt);

    if (durationLeft <= 0) {
      if (toast.visible) {
        dispatch({
          type: ActionType.DISMISS_TOAST,
          id: toast.id,
        });
      }
      return;
    }

    return window.setTimeout(() => {
      dispatch({
        type: ActionType.DISMISS_TOAST,
        id: toast.id,
      });
    }, durationLeft);
  });
};

const removalQueue = new Map<ToastProps["id"], ReturnType<typeof setTimeout>>();

const scheduleRemoval = (id: string, unmountDelay: number) => {
  if (removalQueue.has(id)) return;

  const timeout = window.setTimeout(() => {
    removalQueue.delete(id);
    dispatch({
      type: ActionType.REMOVE_TOAST,
      id,
    });
  }, unmountDelay);

  removalQueue.set(id, timeout);
};

const unscheduleRemoval = (toastId: string) => {
  const timeout = removalQueue.get(toastId);
  removalQueue.delete(toastId);
  if (timeout) window.clearTimeout(timeout);
};

export const dispatch = (action: Action) => {
  switch (action.type) {
    case ActionType.ADD_TOAST: {
      setStore("toasts", (t) => {
        const toasts = t as ToastProps[];
        return [action.toast, ...toasts];
      });
      break;
    }
    case ActionType.DISMISS_TOAST: {
      const { id } = action;

      if (id) {
        const toastToRemove = store.toasts.find((t) => t.id === id);
        if (toastToRemove) scheduleRemoval(id, toastToRemove.unmountDelay);
      }

      setStore(
        "toasts",
        (t) => t.id === id,
        p((t) => (t.visible = false))
      );
      break;
    }
    case ActionType.REMOVE_TOAST: {
      if (!action.id) {
        setStore("toasts", []);
        break;
      }
      setStore("toasts", (t) =>
        (t as ToastProps[]).filter((t) => t.id !== action.id)
      );
      break;
    }
    case ActionType.UPDATE_TOAST: {
      if (action.toast.id) {
        unscheduleRemoval(action.toast.id);
      }

      setStore(
        "toasts",
        (t) => t.id === action.toast.id,
        (t) => ({
          ...(t as ToastProps),
          ...action.toast,
        })
      );
      break;
    }
    case ActionType.PAUSE_TOAST: {
      const toastIdx = store.toasts.findIndex((t) => t.id === action.id);
      setStore("toasts", toastIdx, (t) => {
        const toast = t as ToastProps;
        return {
          ...toast,
          pausedAt: action.time,
        };
      });
      break;
    }
    case ActionType.UNPAUSE_TOAST: {
      const toastIdx = store.toasts.findIndex((t) => t.id === action.id);
      const pauseInterval =
        action.time - (store.toasts[toastIdx].pausedAt || 0);

      setStore(
        p(({ toasts }) => {
          toasts[toastIdx].pausedAt = undefined;
          toasts.forEach((t) => {
            t.pauseDuration += pauseInterval;
          });
        })
      );
      break;
    }
  }
};

export { store };
