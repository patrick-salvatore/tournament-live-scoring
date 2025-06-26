import { lazy } from "solid-js";

import Home from "./pages/home";

export const routes = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "**",
    component: lazy(() => import("./errors/404")),
  },
];
