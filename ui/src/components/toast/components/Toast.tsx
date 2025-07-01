import { Match, Switch, createEffect, createSignal, onMount } from "solid-js";
import { keyframes } from "goober";

import {
  toastBarBase,
  messageContainer,
  entranceAnimation,
  exitAnimation,
  iconContainer,
  getToastYDirection,
  getToastWrapperStyles,
  updateToastHeight,
  getWrapperYAxisOffset,
} from "../util";
import { dispatch } from "../core";
import {
  ActionType,
  type ToastProps,
  resolveValue,
  type ToastPosition,
} from "../types";

import { Success, Error, Loader } from "./index";
import { ProgressBar } from "./ProgressBar";

const ToastBody = (props: { toast: ToastProps; position: ToastPosition }) => {
  const [animation, setAnimation] = createSignal("");

  createEffect(() => {
    props.toast.visible
      ? setAnimation(
          `${keyframes(
            entranceAnimation(getToastYDirection(props.toast, props.position))
          )} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`
        )
      : setAnimation(
          `${keyframes(
            exitAnimation(getToastYDirection(props.toast, props.position))
          )} 0.4s forwards cubic-bezier(.06,.71,.55,1)`
        );
  });

  return (
    <div
      class={props.toast.className}
      style={{
        ...toastBarBase(props.toast.type),
        animation: animation(),
        ...props.toast.style,
      }}
    >
      <Switch>
        <Match when={props.toast.icon}>
          <div style={iconContainer}>{props.toast.icon}</div>
        </Match>
        <Match when={props.toast.type === "loading"}>
          <div style={iconContainer}>
            <Loader {...props.toast.iconTheme} />
          </div>
        </Match>
        <Match when={props.toast.type === "success"}>
          <div style={iconContainer}>
            <Success {...props.toast.iconTheme} />
          </div>
        </Match>
        <Match when={props.toast.type === "error"}>
          <div style={iconContainer}>
            <Error {...props.toast.iconTheme} />
          </div>
        </Match>
      </Switch>
      <div style={messageContainer} {...props.toast.ariaProps}>
        {resolveValue(props.toast.message, props.toast)}
      </div>
      <ProgressBar
        isRunning={!props.toast.pausedAt}
        type={props.toast.type}
        duration={props.toast.duration}
      />
    </div>
  );
};

const calculatePosition = (toast: ToastProps, position: ToastPosition) => {
  const offset = getWrapperYAxisOffset(toast, position);
  const positionStyle = getToastWrapperStyles(position, offset);

  return positionStyle;
};

export const Toast = (props: {
  toast: ToastProps;
  position: ToastPosition;
}) => {
  const [positionStyle, setPositionStyle] = createSignal(
    calculatePosition(props.toast, props.position)
  );

  createEffect(() => {
    const newStyles = calculatePosition(props.toast, props.position);
    setPositionStyle(newStyles);
  });

  let el: HTMLDivElement | undefined = undefined;
  onMount(() => {
    if (el) {
      updateToastHeight(el, props.toast);
    }
  });

  return (
    <div
      ref={el}
      style={positionStyle() as any}
      class={props.toast.visible ? "toast-active" : ""}
      onMouseEnter={() =>
        dispatch({
          type: ActionType.PAUSE_TOAST,
          time: Date.now(),
          id: props.toast.id,
        })
      }
      onMouseLeave={() =>
        dispatch({
          type: ActionType.UNPAUSE_TOAST,
          time: Date.now(),
          id: props.toast.id,
        })
      }
    >
      <ToastBody {...props} />
    </div>
  );
};
