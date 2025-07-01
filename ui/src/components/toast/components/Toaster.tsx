import { createEffect, For, onCleanup } from "solid-js";
import { defaultContainerStyle } from "../core";
import type { ToasterProps, ToastProps } from "..";
import { mergeContainerOptions } from "../util";
import { store, createTimers } from "../core";
import { Toast } from "./Toast";

export const Toaster = (props: ToasterProps) => {
  createEffect(() => {
    mergeContainerOptions(props);
  });

  createEffect(() => {
    // watch toast store changes and schedule timers occuringly
    const timers = createTimers();
    onCleanup(() => {
      if (!timers) return;
      timers.forEach((timer) => timer && clearTimeout(timer));
    });
  });

  const style: any = {
    ...defaultContainerStyle,
    ...props.containerStyle,
  };

  return (
    <div class={props.containerClassName} style={style}>
      <For each={store.toasts}>
        {(toast) => (
          <Toast toast={toast as ToastProps} position={props.position} />
        )}
      </For>
    </div>
  );
};
