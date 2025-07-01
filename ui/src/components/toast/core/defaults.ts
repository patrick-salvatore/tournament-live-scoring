import type { ToasterProps, ToastOptions, ToastTimeouts } from "../types";

export const defaultTimeouts: ToastTimeouts = {
  default: 5500,
  info: 4000,
  warning: 5500,
  error: 5500,
  success: 4000,
  loading: Infinity,
};

export const defaultToastOptions: Required<ToastOptions> = {
  id: "",
  icon: "",
  unmountDelay: 500,
  ariaProps: {
    role: "status",
    "aria-live": "polite",
  },
  className: "",
  style: {},
  iconTheme: {},
  progressBarHidden: false,
};

export const defaultToasterOptions: ToasterProps = {
  position: "top-right",
  toastOptions: defaultToastOptions,
  gutter: 8,
  containerStyle: {},
  containerClassName: "",
};

const defaultContainerPadding = "16px";

export const defaultContainerStyle = {
  position: "fixed",
  "z-index": 9999,
  top: defaultContainerPadding,
  bottom: defaultContainerPadding,
  left: defaultContainerPadding,
  right: defaultContainerPadding,
  "pointer-events": "none",
};
