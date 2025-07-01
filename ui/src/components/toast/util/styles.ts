import { keyframes } from "goober";

import type { ToastType } from "../types";

const toastTheme = (type: ToastType) => {
  let theme;

  if (type === "success") {
    theme = {
      color: "#fff",
      background: "#10b981",
    };
  } else if (type === "info") {
    theme = {
      color: "#fff",
      background: "#0ea5e9",
    };
  } else if (type === "error") {
    theme = {
      color: "#fff",
      background: "#fb7185",
    };
  } else if (type === "warning") {
    theme = {
      color: "#fff",
      background: "#fbbf24",
    };
  } else {
    theme = {
      background: "#f0f9ff",
      color: "#757575;",
    };
  }

  return theme;
};

export const toastBarBase = (type: ToastType): any => ({
  display: "flex",
  padding: "8px 10px",
  "align-items": "center",
  "box-shadow": "0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05)",
  "max-width": "350px",
  "pointer-events": "auto",
  "border-radius": "4px",
  "line-height": "1.3",
  "will-change": "transform",
  ...toastTheme(type),
});

export const entranceAnimation = (direction: number): string => `
0% {transform: translate3d(${direction * 200}%,0,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`;
export const exitAnimation = (direction: number): string => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(${direction * 150}%,0,-1px) scale(.4); opacity:0;}
`;
export const messageContainer = {
  display: "flex",
  "align-items": "center",
  flex: "1 1 auto",
  margin: "4px 10px",
  "white-space": "pre-line",
};

export const iconContainer = {
  "flex-shrink": 0,
  width: "20px",
  height: "20px",
};

export const iconCircle = keyframes`from{transform:scale(0)rotate(45deg);opacity:0;}to{transform:scale(1)rotate(45deg);opacity:1;}`;

export const pingCircle = keyframes`75%,100%{transform: scale(2.25);opacity:0;}`;

export const icon = keyframes`to{stroke-dashoffset: 0;}`;

export const infoDot = keyframes`0%{transform:translate3d(0,0,0);opacity:1;}100%{transform:translate3d(0,7px,0)scale(1);opacity:1;}`;

export const rotate = keyframes`from{transform: rotate(0deg);}to{transform: rotate(360deg);}`;
