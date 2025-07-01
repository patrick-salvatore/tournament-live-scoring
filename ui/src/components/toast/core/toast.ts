import { createSignal } from "solid-js";
import type {
  ToasterProps,
  Message,
  ToastType,
  ToastOptions,
  ToastProps,
  ToastHandler,
} from "../types";
import { ActionType } from "../types";
import {
  defaultToasterOptions,
  defaultToastOptions,
  defaultTimeouts,
} from "./defaults";
import { generateID } from "../util";
import { dispatch } from "./store";

import { resolveValue } from "../types";
import type {
  Renderable,
  ValueOrFunction,
  DefaultToastOptions,
} from "../types";

export const [defaultOpts, setDefaultOpts] = createSignal<ToasterProps>(
  defaultToasterOptions
);

export const createToast = (
  message: Message,
  type: ToastType = "default",
  options: ToastOptions
): ToastProps => ({
  ...defaultToastOptions,
  ...defaultOpts().toastOptions,
  ...options,
  type,
  message,
  pauseDuration: 0,
  createdAt: Date.now(),
  visible: true,
  id: options.id || generateID(),
  style: {
    ...defaultToastOptions.style,
    ...defaultOpts().toastOptions?.style,
    ...options.style,
  },
  duration: defaultTimeouts[type],
  pausedAt: undefined,
});

const createToastCreator =
  (type?: ToastType): ToastHandler =>
  (message: Message, options: ToastOptions = {}) => {
    const toast = createToast(message, type, options);
    dispatch({ type: ActionType.ADD_TOAST, toast });
    return toast.id;
  };

const toast = (message: Message, opts?: ToastOptions) =>
  createToastCreator("default")(message, opts);

toast.error = createToastCreator("error");
toast.success = createToastCreator("success");
toast.loading = createToastCreator("loading");
toast.info = createToastCreator("info");
toast.warning = createToastCreator("warning");

toast.dismiss = (id: string) => {
  dispatch({
    type: ActionType.DISMISS_TOAST,
    id,
  });
};

toast.promise = <T>(
  promise: Promise<T>,
  msgs: {
    loading: Renderable;
    success: ValueOrFunction<Renderable, T>;
    error: ValueOrFunction<Renderable, any>;
  },
  opts?: DefaultToastOptions
) => {
  const id = toast.loading(msgs.loading, { ...opts });

  promise
    .then((p) => {
      toast.success(resolveValue(msgs.success, p), {
        id,
        ...opts,
      });
      return p;
    })
    .catch((e) => {
      toast.error(resolveValue(msgs.error, e), {
        id,
        ...opts,
      });
    });

  return promise;
};

toast.remove = (id?: string) => {
  dispatch({
    type: ActionType.REMOVE_TOAST,
    id,
  });
};

export { toast };
