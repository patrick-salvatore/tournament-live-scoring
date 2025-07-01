import type { ToastProps } from "./toast";

export const ActionType = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  PAUSE_TOAST: "PAUSE_TOAST",
  UNPAUSE_TOAST: "UNPAUSE_TOAST",
} as const

export type PausedAt = number | undefined;

export type Action =
  | {
      type: typeof ActionType.ADD_TOAST;
      toast: ToastProps;
    }
  | {
      type: typeof ActionType.UPDATE_TOAST;
      toast: Partial<ToastProps>;
      silent?: boolean;
    }
  | {
      type: typeof ActionType.DISMISS_TOAST;
      id: string;
    }
  | {
      type: typeof ActionType.REMOVE_TOAST;
      id?: string;
    }
  | {
      type: typeof ActionType.PAUSE_TOAST;
      id: string;
      time: number;
    }
  | {
      type: typeof ActionType.UNPAUSE_TOAST;
      id: string;
      time: number;
    };

export interface State {
  toasts: ToastProps[];
}
