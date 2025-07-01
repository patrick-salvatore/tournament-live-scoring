import {
  setDefaultOpts,
  defaultOpts,
  store,
  dispatch,
  defaultToasterOptions,
} from "../core";
import type { ToastProps, ToasterProps, ToastPosition } from "../types";
import { ActionType } from "../types";

export function generateID() {
  return Math.random().toString(36).substring(2, 9);
}

export const mergeContainerOptions = (props: ToasterProps) => {
  setDefaultOpts((s) => ({
    containerClassName: props.containerClassName ?? s.containerClassName,
    containerStyle: props.containerStyle ?? s.containerStyle,
    gutter: props.gutter ?? s.gutter,
    position: props.position ?? s.position,
    toastOptions: {
      ...props.toastOptions,
    },
  }));
};

export const getToastWrapperStyles = (
  position: ToastPosition,
  offset: number
) => {
  const top = position.includes("top");
  const verticalStyle = top ? { top: 0 } : { bottom: 0 };
  const horizontalStyle = position.includes("center")
    ? { "justify-content": "center" }
    : position.includes("right")
    ? { "justify-content": "flex-end" }
    : {};
  return {
    left: 0,
    right: 0,
    display: "flex",
    position: "absolute",
    transition: `all 230ms cubic-bezier(.21,1.02,.73,1)`,
    transform: `translateY(${offset * (top ? 1 : -1)}px)`,
    ...verticalStyle,
    ...horizontalStyle,
  };
};

export const updateToastHeight = (ref: HTMLDivElement, toast: ToastProps) => {
  const boundingRect = ref.getBoundingClientRect();
  if (boundingRect.height !== toast.height) {
    dispatch({
      type: ActionType.UPDATE_TOAST,
      toast: { id: toast.id, height: boundingRect.height },
      silent: true,
    });
  }
};

export const getWrapperYAxisOffset = (
  toast: ToastProps,
  position: ToastPosition
): number => {
  const gutter = defaultOpts().gutter || defaultToasterOptions.gutter || 8;
  const relevantToasts = store.toasts.filter(
    (t) => (t.position || position) === position && t.height
  );
  const toastIndex = relevantToasts.findIndex((t) => t.id === toast.id);
  const toastsBefore = relevantToasts.filter(
    (toast, i) => i < toastIndex && toast.visible
  ).length;
  const offset = relevantToasts
    .slice(0, toastsBefore)
    .reduce((acc, t) => acc + gutter + (t.height || 0), 0);
  return offset;
};

export const getToastYDirection = (
  toast: ToastProps,
  defaultPos: ToastPosition
) => {
  const position = toast.position || defaultPos;
  const top = position.includes("top");
  return top ? 1 : -1;
};
