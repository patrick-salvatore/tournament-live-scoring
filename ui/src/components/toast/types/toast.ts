import type { JSX } from "solid-js";
import type { PausedAt } from "./store";

export type ToastType =
  | "info"
  | "success"
  | "error"
  | "warning"
  | "loading"
  | "default";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type Renderable = JSX.Element;

export type ValueFunction<TValue, TArg> = (arg: TArg) => TValue;
export type ValueOrFunction<TValue, TArg> =
  | TValue
  | ValueFunction<TValue, TArg>;

export interface IconTheme {
  primary?: string;
  secondary?: string;
}

export interface TToast {
  id: string;
  timeout: number;
  pausedAt: PausedAt;
  props: ToastProps;
}

export interface ToastProps {
  type: ToastType;
  id: string;
  message: ValueOrFunction<Renderable, ToastProps>;
  duration: number;
  progressBarHidden?: boolean;
  icon?: Renderable;
  pauseDuration: number;
  position?: ToastPosition;

  ariaProps: {
    role: "status" | "alert";
    "aria-live": "assertive" | "off" | "polite";
  };

  style?: JSX.CSSProperties;
  className?: string;

  iconTheme?: IconTheme;

  createdAt: number;
  updatedAt?: number;
  visible: boolean;
  height?: number;
  unmountDelay: number;
  pausedAt: PausedAt;
}

export type ToastOptions = Partial<
  Pick<
    ToastProps,
    | "id"
    | "icon"
    | "ariaProps"
    | "className"
    | "style"
    | "unmountDelay"
    | "iconTheme"
    | "progressBarHidden"
  >
>;

export type ToastTimeouts = {
  [key in ToastType]: number;
};

export type DefaultToastOptions = ToastOptions;

export type Message = ValueOrFunction<Renderable, ToastProps>;

export type ToastHandler = (message: Message, options?: ToastOptions) => string;

export interface ToasterProps {
  position: ToastPosition;
  toastOptions?: DefaultToastOptions;
  gutter?: number;
  containerStyle?: JSX.CSSProperties;
  containerClassName?: string;
}

export interface ToastBarProps {
  toast: ToastProps;
  position: ToastPosition;
}

export type IconProps = Partial<IconTheme>;

export const TOAST_POSITION = {
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  TOP_CENTER: "top-center",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right",
  BOTTOM_CENTER: "bottom-center",
} as const;

const isFunction = <TValue, TArg>(
  valOrFunction: ValueOrFunction<TValue, TArg>
): valOrFunction is ValueFunction<TValue, TArg> =>
  typeof valOrFunction === "function";

export const resolveValue = <TValue, TArg>(
  valOrFunction: ValueOrFunction<TValue, TArg>,
  arg: TArg
): TValue => (isFunction(valOrFunction) ? valOrFunction(arg) : valOrFunction);
